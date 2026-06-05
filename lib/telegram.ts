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
  if (type === "card") return "Картой онлайн"
  if (type === "cod") return "Наложенный платёж"
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

  const clientName = order.user.name || "Не указано"
  const phone = order.user.phone || "Не указано"

  const paymentLabelMap: Record<string, string> = { card: "Оплачено карткою", cod: "Накладений платіж" }
  const paymentLabel = paymentLabelMap[order.paymentType] || order.paymentType

  let productsList = "—"

  const raw = order.orderItems
  if (Array.isArray(raw) && raw.length > 0) {
    const entries = raw as { productId?: number; quantity?: number }[]
    const pids = entries
      .map((e) => Number(e.productId))
      .filter((id) => Number.isFinite(id) && id > 0)

    if (pids.length > 0) {
      try {
        const prods = await import("@/lib/prisma").then((m) =>
          m.default.product.findMany({
            where: { id: { in: pids } },
            select: { id: true, name: true },
          })
        )
        const nameById = new Map(prods.map((p) => [p.id, p.name]))

        const lines = entries.map((e) => {
          const pid = Number(e.productId)
          const qty = Number(e.quantity) || 1
          const name = nameById.get(pid) || `ID ${pid}`
          return `\\- ${name} \\— x${qty}`
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
      .map((p) => `\\- ${p.trim()}`)
      .join("\n")
  }

  const text = [
    `📦 *НОВА ТТН СТВОРЕНА\\!*`,
    ``,
    `• *Номер замовлення:* \\#${order.orderNumber}`,
    `• *ТТН:* \`${order.ttn}\``,
    `• *Клієнт:* ${escapeMd(clientName)} \\(${escapeMd(phone)}\\)`,
    ``,
    `📋 *СКЛАД ЗАМОВЛЕННЯ ДЛЯ ФАСОВКИ:*`,
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
      console.error("[telegram] TTN sendMessage FAILED:", JSON.stringify(json))
    }
  } catch (err) {
    console.error("[telegram] TTN sendMessage error:", err)
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
    console.warn("[telegram] Check /home/brosco/.env — must contain TELEGRAM_BOT_TOKEN=... and TELEGRAM_ADMIN_TOKEN=...")
    return
  }

  const clientName = order.user.name || "Не указано"
  const phone = order.user.phone || "Не указано"
  const city = order.cityName || ""
  const warehouse = order.deliveryPoint || ""
  const deliveryParts = [city, warehouse].filter(Boolean)
  const delivery = deliveryParts.length ? deliveryParts.join(", ") : "Не указана"

  const itemLines = parseItems(order.items)
  const productsList = itemLines.length
    ? itemLines.join("\n")
    : "—"

  const commentText = order.comment?.trim()
    ? `📝 <b>Комментарий:</b> "${order.comment.trim()}"`
    : ""

  const paymentText = paymentLabel(order.paymentType)
  const cleanPhone = order.user.phone.replace(/\D/g, "")

  const text = [
    `🔥 <b>Новый заказ №${order.orderNumber}</b>`,
    ` `,
    `👤 <b>Клиент:</b> ${clientName}`,
    `📱 <b>Телефон:</b> +${cleanPhone}`,
    `📵 <b>Звонить?:</b> ${order.noCall ? "❌ Нет" : "✅ Да"}`,
    `📍 <b>Доставка:</b> ${delivery}`,
    `💳 <b>Оплата:</b> ${paymentText}`,
    `💰 <b>Итого к оплате:</b> ${order.total} ₴`,
    ``,
    `🛒 <b>Товары:</b>`,
    productsList,
    commentText,
  ].filter(Boolean).join("\n")

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://brosco.com.ua").replace(/\/+$/, "")
  const adminGatePath = process.env.ADMIN_GATE_PATH?.trim() || "/admin"
  const ttnUrl = `${siteUrl}${adminGatePath}/orders/${order.id}/create-ttn`
  console.log("[telegram] ttnUrl:", ttnUrl)

  const body = {
    chat_id: adminChatId,
    parse_mode: "HTML",
    text,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚚 Создать ТТН в Новой Почте",
            url: ttnUrl,
          },
        ],
      ],
    },
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
      console.error("[telegram] sendMessage FAILED:", JSON.stringify(json))
    } else {
      console.log("[telegram] sendMessage OK")
    }
  } catch (err) {
    console.error("[telegram] sendMessage NETWORK error:", err)
  }
}
