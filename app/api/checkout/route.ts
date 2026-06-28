import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { createPaymentLink } from "@/lib/myiban"
import { sendOrderNotification } from "@/lib/telegram"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      phone,
      firstName,
      lastName,
      middleName,
      orderItems,
      delivery,
      paymentType,
      noCall,
      comment,
      deliveryType: deliveryTypeRaw,
      city,
      deliveryPoint,
      courier,
    } = body
    const nameParts = [lastName, firstName, middleName]
      .map((v: unknown) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
    const fullName = nameParts.join(" ")

    const cityName =
      typeof city === "object" && city !== null && "name" in city && typeof (city as { name: unknown }).name === "string"
        ? (city as { name: string }).name
        : ""
    const cityRef =
      typeof city === "object" && city !== null && "ref" in city && typeof (city as { ref: unknown }).ref === "string"
        ? (city as { ref: string }).ref
        : ""

    const deliveryPointStr = typeof deliveryPoint === "string" ? deliveryPoint : ""
    const deliveryTypeStr =
      deliveryTypeRaw === "warehouse" || deliveryTypeRaw === "postomat" || deliveryTypeRaw === "courier"
        ? deliveryTypeRaw
        : "warehouse"

    const courierHouse =
      typeof courier === "object" && courier !== null && "house" in courier && typeof (courier as { house: unknown }).house === "string"
        ? (courier as { house: string }).house
        : ""
    const courierApartment =
      typeof courier === "object" && courier !== null && "apartment" in courier && typeof (courier as { apartment: unknown }).apartment === "string"
        ? (courier as { apartment: string }).apartment
        : ""
    const courierEntrance =
      typeof courier === "object" && courier !== null && "entrance" in courier && typeof (courier as { entrance: unknown }).entrance === "string"
        ? (courier as { entrance: string }).entrance
        : ""
    const courierFloor =
      typeof courier === "object" && courier !== null && "floor" in courier && typeof (courier as { floor: unknown }).floor === "string"
        ? (courier as { floor: string }).floor
        : ""

    const commentStr = typeof comment === "string" ? comment : ""

    // 1. Шукаємо або створюємо користувача
    let user = await prisma.user.findUnique({
      where: { phone: phone }
    })

    let isNewUser = false
    if (!user) {
      isNewUser = true
      const defaultPassword = phone.replace(/\D/g, "").slice(-6) || "000000"
      const hashedPassword = hashPassword(defaultPassword)

      user = await prisma.user.create({
        data: {
          phone: phone,
          name: fullName,
          password: hashedPassword,
        }
      })
    } else if (fullName && user.name !== fullName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: fullName },
      })
    }

    // 1.5. Підготувати список товарів із кількостями
    const rawItems: { productId: unknown; cartItemId: unknown; quantity: unknown }[] = Array.isArray(orderItems) ? orderItems : []
    const orderItemEntries: { productId: number; variantId: number | null; quantity: number }[] = []
    for (const raw of rawItems) {
      const pid = Number(raw.productId)
      const cid = Number(raw.cartItemId)
      const qty = Number(raw.quantity)
      if (!Number.isFinite(pid) || !Number.isFinite(qty) || qty < 1 || pid < 1) continue
      const variantId = Number.isFinite(cid) && cid !== pid ? cid : null
      orderItemEntries.push({ productId: pid, variantId, quantity: qty })
    }

    if (orderItemEntries.length === 0) {
      return NextResponse.json({ error: "Кошик порожній" }, { status: 400 })
    }

    // 2. ВСЕ В ОДНІЙ ТРАНЗАКЦІЇ: валідація → збір цін з БД → списання stock → створення замовлення
    const txResult = await prisma.$transaction(async (tx) => {
      const dbProducts = await tx.product.findMany({
        where: { id: { in: orderItemEntries.map((e) => e.productId) } },
        select: { id: true, name: true, price: true, stock: true },
      })
      const dbById = new Map(dbProducts.map((p) => [p.id, p]))

      // Resolve variant IDs that slipped through as productId
      // (e.g. old cart items without proper productId)
      const unresolved = orderItemEntries.filter((e) => !dbById.has(e.productId))
      if (unresolved.length > 0) {
        const variantIds = unresolved.map((e) => e.productId)
        const dbVariants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, productId: true, priceRetail: true },
        })
        const variantMap = new Map(dbVariants.map((v) => [v.id, v]))
        for (const entry of unresolved) {
          const v = variantMap.get(entry.productId)
          if (v) {
            // Replace variant ID with parent product ID
            const parentProduct = await tx.product.findUnique({
              where: { id: v.productId },
              select: { id: true, name: true, price: true, stock: true },
            })
            if (parentProduct) {
               dbById.set(parentProduct.id, parentProduct)
               // Save the original variant ID, then replace productId with parent
               const originalVariantId = entry.productId
               entry.productId = parentProduct.id
               if (!entry.variantId) entry.variantId = originalVariantId
             }
          }
        }
      }

      for (const entry of orderItemEntries) {
        const p = dbById.get(entry.productId)
        if (!p) {
          throw new Error(`Товар з ID ${entry.productId} не знайдено`)
        }
        if (p.stock < entry.quantity) {
          throw new Error(`Недостатньо товару «${p.name}» в наявності`)
        }
      }

      let serverTotal = 0
      const itemsParts: string[] = []
      const variantInfoMap = new Map<number, { size: string; price: number }>()
      // Fetch variant sizes AND prices for variant items
      const variantIdsNeeded = orderItemEntries
        .filter((e) => e.variantId !== null)
        .map((e) => e.variantId!)
      if (variantIdsNeeded.length > 0) {
        const dbVariants = await tx.productVariant.findMany({
          where: { id: { in: variantIdsNeeded } },
          select: { id: true, size: true, volume: true, priceRetail: true },
        })
        for (const v of dbVariants) {
          variantInfoMap.set(v.id, {
            size: v.size || v.volume || "",
            price: v.priceRetail,
          })
        }
      }
      for (const entry of orderItemEntries) {
        const p = dbById.get(entry.productId)!
        // STRICT rule: if variant is selected, use variant price, NOT product.price
        const variantInfo = entry.variantId ? variantInfoMap.get(entry.variantId) : null
        const effectivePrice = variantInfo ? variantInfo.price : p.price
        const lineTotal = effectivePrice * entry.quantity
        serverTotal += lineTotal
        const sizeStr = variantInfo ? variantInfo.size : ""
        const nameWithSize = sizeStr ? `${p.name} (${sizeStr})` : p.name
        itemsParts.push(`${nameWithSize} x${entry.quantity} - ${Math.round(lineTotal)} ₴`)
      }

      for (const entry of orderItemEntries) {
        const p = dbById.get(entry.productId)!
        const newStock = Math.max(0, p.stock - entry.quantity)
        await tx.product.update({
          where: { id: entry.productId },
          data: { stock: newStock },
        })

        if (entry.variantId !== null) {
          const variant = await tx.productVariant.findUnique({
            where: { id: entry.variantId },
            select: { stock: true },
          })
          if (variant) {
            const newVariantStock = Math.max(0, (variant?.stock ?? 0) - entry.quantity)
            await tx.productVariant.update({
              where: { id: entry.variantId },
              data: { stock: newVariantStock },
            })
          }
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber: `pending-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          total: serverTotal,
          status: "NEW",
          paymentType: paymentType === "cod" ? "cod" : "card",
          paymentStatus: "UNPAID",
          noCall: Boolean(noCall),
          comment: commentStr,
          deliveryType: deliveryTypeStr,
          cityName: cityName,
          cityRef: cityRef,
          deliveryPoint: deliveryPointStr,
          courierHouse: courierHouse,
          courierApartment: courierApartment,
          courierEntrance: courierEntrance,
          courierFloor: courierFloor,
          items: itemsParts.join(", "),
          orderItems: orderItemEntries,
          delivery: delivery,
          userId: user.id
        }
      })

      return created
    })

    // 3. Отримуємо фінальний номер замовлення (ID з бази)
    const finalOrderNumber = txResult.id.toString()
    
    await prisma.order.update({
      where: { id: txResult.id },
      data: { orderNumber: finalOrderNumber }
    })

    try {
      await sendOrderNotification({
        id: txResult.id,
        orderNumber: finalOrderNumber,
        total: txResult.total,
        user: { phone: user.phone, name: user.name },
        cityName: txResult.cityName,
        deliveryPoint: txResult.deliveryPoint,
        items: txResult.items,
        comment: txResult.comment,
        paymentType: txResult.paymentType,
        noCall: txResult.noCall,
      })
    } catch (telegramErr) {
      console.error("[checkout] Telegram notification failed:", telegramErr)
    }

    // 4. ГЕНЕРАЦІЯ ПОСИЛАННЯ (Тільки для оплати карткою)
    let paymentUrl: string | undefined = undefined
    if (paymentType === 'card') {
      try {
        const url = await createPaymentLink(txResult.total, finalOrderNumber)
        if (url) {
          paymentUrl = url
          await prisma.order.update({
            where: { id: txResult.id },
            data: { paymentUrl },
          })
        }
      } catch (payError) {
        console.error("MYIBAN_ERROR:", payError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      orderId: finalOrderNumber,
      paymentUrl: paymentUrl || undefined,
      isNewUser,
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : "Помилка сервера"
    const isValidationError =
      message.includes("Недостатньо товару") || message.includes("не знайдено")

    logger.error(`POST /api/checkout | ${message}`, {
      stack: error instanceof Error ? error.stack : undefined,
      validationError: isValidationError,
    })

    return NextResponse.json(
      { success: false, error: message },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
