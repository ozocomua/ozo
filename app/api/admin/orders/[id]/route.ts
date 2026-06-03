import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"
import { normalizeOrderStatus } from "@/lib/order-status"
import { normalizePaymentStatus } from "@/lib/payment-status"
import { sendTtnNotification } from "@/lib/telegram"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const orderId = Number(id)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const statusRaw =
    typeof body === "object" && body !== null && "status" in body
      ? (body as { status?: unknown }).status
      : null

  const paymentStatusRaw =
    typeof body === "object" && body !== null && "paymentStatus" in body
      ? (body as { paymentStatus?: unknown }).paymentStatus
      : null

  const addTagRaw =
    typeof body === "object" && body !== null && "addTag" in body
      ? (body as { addTag?: unknown }).addTag
      : null

  const removeTagRaw =
    typeof body === "object" && body !== null && "removeTag" in body
      ? (body as { removeTag?: unknown }).removeTag
      : null

  const ttnRaw =
    typeof body === "object" && body !== null && "ttn" in body
      ? (body as { ttn?: unknown }).ttn
      : null

  const nextStatus =
    typeof statusRaw === "string" ? normalizeOrderStatus(statusRaw) : null

  const nextPaymentStatus =
    typeof paymentStatusRaw === "string" ? normalizePaymentStatus(paymentStatusRaw) : null

  const addTag = typeof addTagRaw === "string" ? addTagRaw.trim() : ""
  const removeTag = typeof removeTagRaw === "string" ? removeTagRaw.trim() : ""

  const nextTtn = typeof ttnRaw === "string" ? ttnRaw.trim() || null : null

  if (!nextStatus && !nextPaymentStatus && !addTag && !removeTag && nextTtn === null) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        orderNumber: true,
        total: true,
        items: true,
        orderItems: true,
        ttn: true,
        comment: true,
        paymentType: true,
        user: { select: { phone: true, name: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const oldStatus = order.status

    await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(nextStatus ? { status: nextStatus } : null),
        ...(nextPaymentStatus ? { paymentStatus: nextPaymentStatus } : null),
        ...(nextTtn !== null ? { ttn: nextTtn } : null),
      },
    })

    if (addTag) {
      await prisma.orderTag.create({
        data: { orderId, name: addTag.slice(0, 40) },
      })
    }

    if (removeTag) {
      await prisma.orderTag.deleteMany({ where: { orderId, name: removeTag } })
    }

    if (nextStatus) {
      const linkTag = `[order:${order.id}]`
      const today = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })

      if (nextStatus === "SHIPPED" && oldStatus !== "SHIPPED") {
        const rawOrderItems = order.orderItems as
          | { productId: number; quantity: number }[]
          | null
          | undefined

        const orderItemEntries: { productId: number; quantity: number }[] =
          Array.isArray(rawOrderItems)
            ? rawOrderItems
                .map((e) => ({ productId: Number(e.productId), quantity: Number(e.quantity) }))
                .filter((e) => Number.isFinite(e.productId) && Number.isFinite(e.quantity) && e.quantity > 0)
            : []

        if (orderItemEntries.length === 0) {
          console.warn(
            `[SHIPPED] order #${order.id}: orderItems JSON is empty or missing, will parse items text field`
          )
        }

        let saleItems: { type: string; itemId: number; qty: number; customPrice: number }[]

        if (orderItemEntries.length > 0) {
          const productIds = orderItemEntries.map((e) => e.productId)
          const calcProducts = await prisma.calculatorProduct.findMany({
            where: { id: { in: productIds } },
            select: { id: true, sale: true },
          })
          const calcById = new Map(calcProducts.map((cp) => [cp.id, cp]))

          const catalogProducts = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, price: true, productType: true },
          })
          const catalogById = new Map(catalogProducts.map((p) => [p.id, p]))

          saleItems = orderItemEntries.map((entry) => {
            const calc = calcById.get(entry.productId)
            const cat = catalogById.get(entry.productId)
            const price = cat?.price ?? calc?.sale ?? order.total
            const isBundle = cat?.productType === "BUNDLE"
            return {
              type: isBundle ? "bundle" : "product",
              itemId: entry.productId,
              qty: entry.quantity,
              customPrice: price,
            }
          })
        } else {
          const itemsText = typeof order.items === "string" ? order.items : ""
          const itemNames = itemsText
            .split(",")
            .map((p) => p.replace(/\s+x\d+.*$/i, "").trim())
            .filter(Boolean)

          if (itemNames.length > 0) {
            const matchedProducts = await prisma.product.findMany({
              where: { name: { in: itemNames }, isPublished: true },
              select: { id: true, name: true, price: true, productType: true },
            })
            const byName = new Map(matchedProducts.map((p) => [p.name.toLowerCase(), p]))

            saleItems = itemNames.map((name) => {
              const prod = byName.get(name.toLowerCase())
              const qtyMatch = itemsText.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+x(\\d+)", "i"))
              const qty = qtyMatch ? parseInt(qtyMatch[1], 10) || 1 : 1
              const isBundle = prod?.productType === "BUNDLE"
              return {
                type: isBundle ? "bundle" : "product",
                itemId: prod?.id ?? 0,
                qty,
                customPrice: prod?.price ?? order.total,
              }
            })
          } else {
            saleItems = [{ type: "product", itemId: 0, qty: 1, customPrice: order.total }]
          }
        }

        await prisma.financeSale.create({
          data: {
            timestamp: BigInt(Date.now()),
            date: today,
            type: "sale",
            status: "transit",
            comment: `#${order.orderNumber} | ${order.user.phone}${order.user.name ? " | " + order.user.name : ""} | ${linkTag}`,
            items: saleItems,
          },
        })
      }

      if (nextStatus === "RECEIVED" && oldStatus !== "RECEIVED") {
        const linkedSale = await prisma.financeSale.findFirst({
          where: { comment: { contains: linkTag } },
          orderBy: { timestamp: "desc" },
        })
        if (linkedSale) {
          await prisma.financeSale.update({
            where: { id: linkedSale.id },
            data: { status: "paid" },
          })
        }
      }
    }

    if (nextTtn && nextTtn !== "" && order.ttn !== nextTtn) {
      sendTtnNotification({
        id: order.id,
        orderNumber: order.orderNumber,
        ttn: nextTtn,
        total: order.total,
        user: order.user,
        items: order.items,
        orderItems: order.orderItems,
        paymentType: order.paymentType,
      }).catch((err) => console.error("[order-update] TTN notification failed:", err))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("ORDER_UPDATE_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося оновити замовлення." }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const orderId = Number(id)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 })
  }

  try {
    await prisma.order.delete({ where: { id: orderId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("ORDER_DELETE_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося видалити замовлення." }, { status: 500 })
  }
}
