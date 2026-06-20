import { logger } from "@/lib/logger"
import { formatPhone } from "@/lib/phone-format"

export interface TelegramOrderPayload {
  orderNumber: string
  clientName: string | null
  phone: string
  city: string | null
  warehouse: string | null
  total: number
}

function parseItems(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((item: unknown) => {
        if (typeof item === "object" && item !== null) {
          const i = item as Record<string, unknown>
          const name = typeof i.name === "string" ? i.name : ""
          const qty = typeof i.quantity === "number" ? i.quantity : typeof i.quantity === "string" ? (parseInt(i.quantity, 10) || 1) : 1
          const price = typeof i.price === "number" ? i.price : typeof i.price === "string" ? parseFloat(i.price) : 0
          const line = qty > 1 ? `${name} (${qty} шт.) — ${(price * qty).toFixed(2)} ₴` : `${name} — ${price.toFixed(2)} ₴`
          return line
        }
        return String(item)
      })
    }
  } catch {
    // not JSON
  }
  return raw.split(/,\s*/).filter(Boolean).map((s) => `• ${s.trim()}`)
}

function paymentLabel(type: string): string {
  if (type === "card") return "Оплата карткою"
  if (type === "cod") return "Накладений платіж"
  return type
}

function escapeMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")
}

export async function sendTtnNotification(order: {
  id: number
  orderNumber: string
  ttn: string
  total: number
  user: { phone: string; name: string | null }
  items: string | null
  orderItems: unknown
  paymentType: string
}): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = process.env.TELEGRAM_ADMIN_TOKEN

  if (!botToken || !adminChatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_TOKEN not set; skipping TTN notification")
    return
  }

  const clientName = order.user.name || "Не вказано"
  const phone = formatPhone(order.user.phone)

  const paymentLabelMap: Record<string, string> = { card: "Оплачено карткою", cod: "Накладений платіж" }
  const paymentLabel = paymentLabelMap[order.paymentType] || order.paymentType

  let productsList = "—"

  const raw = order.orderItems
  if (Array.isArray(raw) && raw.length > 0) {
    const entries = raw as { productId?: number; variantId?: number | null; quantity?: number }[]
    const pids = entries
      .map((e) => Number(e.productId))
      .filter((id) => Number.isFinite(id) && id > 0)

    if (pids.length > 0) {
      try {
        const prods = await import("@/lib/prisma").then((m) =>
          m.default.product.findMany({
            where: { id: { in: pids } },
            select: { id: true, name: true, price: true },
          })
        )
        const nameById = new Map(prods.map((p) => [p.id, p.name]))
        const productPriceById = new Map(prods.map((p) => [p.id, p.price]))

        // Fetch variant sizes AND prices for items that have variantId
        const variantIds = entries
          .map((e) => e.variantId)
          .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v) && v > 0)
        const sizeById = new Map<number, string>()
        const variantPriceById = new Map<number, number>()
        if (variantIds.length > 0) {
          const variants = await import("@/lib/prisma").then((m) =>
            m.default.productVariant.findMany({
              where: { id: { in: variantIds } },
              select: { id: true, size: true, volume: true, priceRetail: true },
            })
          )
          for (const v of variants) {
            sizeById.set(v.id, v.size || v.volume || "")
            variantPriceById.set(v.id, v.priceRetail)
          }
        }

        const lines = entries.map((e) => {
          const pid = Number(e.productId)
          const qty = Number(e.quantity) || 1
          const rawName = nameById.get(pid) || `ID ${pid}`
          const name = escapeMd(rawName)
          const sizeStr = e.variantId ? (sizeById.get(e.variantId) || "") : ""
          const fullName = sizeStr ? `${name} \\(${escapeMd(sizeStr)}\\)` : name
          // Price: variant price takes priority, fallback to product price
          const unitPrice = e.variantId
            ? (variantPriceById.get(e.variantId) ?? productPriceById.get(pid) ?? 0)
            : (productPriceById.get(pid) ?? 0)
          const lineTotal = Math.round(unitPrice * qty)
          return `\\- ${fullName} \\— x${qty} \\(${lineTotal} ₴\\)`
        })
        productsList = lines.join("\n")
      } catch {
        // fallback to text items
      }
    }
  }

  if (productsList === "—" && typeof order.items === "string" && order.items.trim()) {
    productsList = order.items
      .split(",")
      .map((p) => `\\- ${escapeMd(p.trim())}`)
      .join("\n")
  }

  const text = [
    `📦 *НОВА ТТН СТВОРЕНА\\!*`,
    ``,
    `• *Номер замовлення:* \\#${order.orderNumber}`,
    `• *ТТН:* \`${order.ttn}\``,
    `• *Клієнт:* ${escapeMd(clientName)} \\(${escapeMd(phone)}\\)`,
    ``,
    `📋 *СКЛАД ЗАМОВЛЕННЯ:*`,
    productsList,
    ``,
    `💵 *Сума до сплати:* ${order.total} грн \\(${escapeMd(paymentLabel)}\\)`,
  ].join("\n")

  const body = {
    chat_id: adminChatId,
    parse_mode: "MarkdownV2",
    text,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📦 Упаковано",
            callback_data: `status_packed_${order.id}`,
          },
        ],
      ],
    },
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      logger.error("[telegram] TTN sendMessage FAILED", {
        orderNumber: order.orderNumber,
        response: json,
      })
    }
  } catch (err) {
    logger.error("[telegram] TTN sendMessage network error", {
      orderNumber: order.orderNumber,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

export async function sendOrderNotification(order: {
  id: number
  orderNumber: string
  total: number
  user: { phone: string; name: string | null }
  cityName: string | null
  deliveryPoint: string | null
  items: string | null
  comment: string | null
  paymentType: string
  noCall: boolean
}): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = process.env.TELEGRAM_ADMIN_TOKEN

  console.log("[telegram] sendOrderNotification called")
  console.log("[telegram] botToken set:", Boolean(botToken), "length:", botToken?.length ?? 0)
  console.log("[telegram] adminChatId set:", Boolean(adminChatId), "value:", adminChatId)

  if (!botToken || !adminChatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_TOKEN is not set; skipping notification")
    console.warn("[telegram] Check /home/ozo/.env — must contain TELEGRAM_BOT_TOKEN=... and TELEGRAM_ADMIN_TOKEN=...")
    return
  }

  const clientName = order.user.name || "Не вказано"
  const phone = formatPhone(order.user.phone)
  const city = order.cityName || ""
  const warehouse = order.deliveryPoint || ""
  const deliveryParts = [city, warehouse].filter(Boolean)
  const delivery = deliveryParts.length ? deliveryParts.join(", ") : "Не вказана"

  const itemLines = parseItems(order.items)
  const productsList = itemLines.length
    ? itemLines.join("\n")
    : "—"

  const commentText = order.comment?.trim()
    ? `📝 <b>Коментар:</b> "${order.comment.trim()}"`
    : ""

  const paymentText = paymentLabel(order.paymentType)

  const text = [
    `🔥 <b>Нове замовлення №${order.orderNumber}</b>`,
    ` `,
    `👤 <b>Клієнт:</b> ${clientName}`,
    `📱 <b>Телефон:</b> ${phone}`,
    `📵 <b>Дзвонити?:</b> ${order.noCall ? "❌ Ні" : "✅ Так"}`,
    `📍 <b>Доставка:</b> ${delivery}`,
    `💳 <b>Оплата:</b> ${paymentText}`,
    `💰 <b>Сума до оплати:</b> ${order.total} ₴`,
    ``,
    `🛒 <b>Товари:</b>`,
    productsList,
    commentText,
  ].filter(Boolean).join("\n")

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "").replace(/\/+$/, "")
  const adminGatePath = process.env.ADMIN_GATE_PATH?.trim() || "/admin"
  const ttnUrl = `${siteUrl}${adminGatePath}/orders/${order.id}/create-ttn`
  console.log("[telegram] ttnUrl:", ttnUrl)

  const isLocalUrl = siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1") || siteUrl.startsWith("http://10.") || siteUrl.startsWith("http://192.168.")

  const body: Record<string, unknown> = {
    chat_id: adminChatId,
    parse_mode: "HTML",
    text,
  }

  if (isLocalUrl) {
    // Telegram не принимает localhost в inline-кнопках — добавляем ссылку текстом
    body.text = text + `\n\n🔗 <a href="${ttnUrl}">Створити ТТН в Новій Пошті</a>`
    console.log("[telegram] local URL detected, link added as text instead of button")
  } else {
    body.reply_markup = {
      inline_keyboard: [
        [
          {
            text: "🚚 Створити ТТН в Новій Пошті",
            url: ttnUrl,
          },
        ],
      ],
    }
  }

  console.log("[telegram] sending to:", `https://api.telegram.org/bot***/sendMessage`)
  console.log("[telegram] chat_id:", adminChatId)

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const json = await res.json().catch(() => ({}))
    console.log("[telegram] response status:", res.status)
    console.log("[telegram] response body:", JSON.stringify(json))

    if (!res.ok) {
      logger.error("[telegram] sendOrderNotification FAILED", {
        orderNumber: order.orderNumber,
        response: json,
      })
    }
  } catch (err) {
    logger.error("[telegram] sendOrderNotification network error", {
      orderNumber: order.orderNumber,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

/**
 * Відправляє в Telegram сповіщення про будь-яку помилку на сайті.
 */
export async function sendErrorToTelegram(error: {
  source: string
  message: string
  userName?: string
  phone?: string
  stack?: string
}): Promise<{ ok: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = process.env.TELEGRAM_ADMIN_TOKEN

  if (!botToken || !adminChatId) {
    const err = "TELEGRAM_BOT_TOKEN або TELEGRAM_ADMIN_TOKEN не задано в .env"
    console.warn(`[telegram] sendErrorToTelegram: ${err}`)
    return { ok: false, error: err }
  }

  const now = new Date().toLocaleString("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const lines = [
    "🚨 <b>ПОМИЛКА НА САЙТІ</b>",
    "",
    `<b>Джерело:</b> ${error.source}`,
    `<b>Помилка:</b> ${error.message.slice(0, 500)}`,
  ]

  if (error.userName) lines.push(`<b>Користувач:</b> ${error.userName}`)
  if (error.phone) lines.push(`<b>Телефон:</b> ${formatPhone(error.phone)}`)
  if (error.stack) lines.push(`<pre>${error.stack.slice(0, 800)}</pre>`)

  lines.push("", `🕐 ${now}`)

  const text = lines.join("\n")

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: adminChatId,
        text,
        parse_mode: "HTML",
      }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      const err = `Telegram API: ${res.status} — ${JSON.stringify(json)}`
      logger.error("[telegram] sendErrorToTelegram — Telegram API error", {
        status: res.status,
        body: json,
      })
      return { ok: false, error: err }
    }

    console.log("[telegram] sendErrorToTelegram — success")
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("[telegram] sendErrorToTelegram — network error", { error: msg })
    return { ok: false, error: `Network error: ${msg}` }
  }
}
