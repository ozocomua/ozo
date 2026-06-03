import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ""

async function editMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup: object | null,
) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        ...(replyMarkup !== null ? { reply_markup: replyMarkup } : {}),
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error("[webhook] editMessageText failed:", JSON.stringify(err))
    }
  } catch (err) {
    console.error("[webhook] editMessageText network error:", err)
  }
}

async function handlePacked(orderId: number, chatId: string | number, messageId: number, currentText: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  })
  if (!order || order.status === "SHIPPED" || order.status === "RECEIVED") return

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PACKED" },
  })

  const newText = `⚠️ <b>СТАТУС: УПАКОВАНО.</b> Очікує відправки.\n\n${currentText}`

  await editMessage(chatId, messageId, newText, {
    inline_keyboard: [
      [
        {
          text: "🚚 Відправлено",
          callback_data: `status_shipped_${orderId}`,
        },
      ],
    ],
  })
}

async function handleShipped(orderId: number, chatId: string | number, messageId: number, currentText: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      orderNumber: true,
      total: true,
      items: true,
      orderItems: true,
      user: { select: { phone: true, name: true } },
    },
  })
  if (!order || order.status === "SHIPPED" || order.status === "RECEIVED") return
  const oldStatus = order.status

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED" },
  })

  if (oldStatus !== "SHIPPED") {
    const linkTag = `[order:${order.id}]`
    const today = new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })

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
          const qtyMatch = itemsText.match(
            new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+x(\\d+)", "i")
          )
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

  const newText = `${currentText}\n\n✅ <b>ВІДПРАВЛЕНО</b>`

  await editMessage(chatId, messageId, newText, null)
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (body.callback_query) {
    const cq = body.callback_query as Record<string, unknown>
    const data = typeof cq.data === "string" ? cq.data : ""
    const msg = cq.message as Record<string, unknown> | undefined
    const chatId = msg?.chat ? (msg.chat as Record<string, unknown>).id : undefined
    const messageId = typeof msg?.message_id === "number" ? msg.message_id : undefined
    const currentText = typeof msg?.text === "string" ? msg.text : ""
    const callbackQueryId = typeof cq.id === "string" ? cq.id : ""

    if (!data || !chatId || !messageId) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    if (callbackQueryId) {
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      }).catch(() => {})
    }

    const packedMatch = data.match(/^status_packed_(\d+)$/)
    const shippedMatch = data.match(/^status_shipped_(\d+)$/)

    if (packedMatch) {
      const orderId = parseInt(packedMatch[1], 10)
      if (Number.isFinite(orderId)) {
        await handlePacked(orderId, chatId, messageId, currentText)
      }
    } else if (shippedMatch) {
      const orderId = parseInt(shippedMatch[1], 10)
      if (Number.isFinite(orderId)) {
        await handleShipped(orderId, chatId, messageId, currentText)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
