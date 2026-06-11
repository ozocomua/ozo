import { NextResponse } from "next/server"

export async function POST(req: Request) {
  let body: { name?: string; phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Некоректний запит" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""

  if (!name) {
    return NextResponse.json({ error: "Будь ласка, вкажіть ваше ім'я" }, { status: 400 })
  }
  if (!phone || phone.replace(/[\s\-()+]/g, "").length < 10) {
    return NextResponse.json({ error: "Будь ласка, вкажіть коректний номер телефону" }, { status: 400 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const adminChatId = process.env.TELEGRAM_ADMIN_TOKEN

  const kyivTime = new Date().toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  })

  if (botToken && adminChatId) {
    const msg = [
      "⚠️ ПОДВІЙНА УВАГА! ЗАЯВКА ПРИ ПОГАНОМУ ІНТЕРНЕТІ ⚠️",
      "",
      `👤 Клієнт: ${name}`,
      `📞 Телефон: ${phone}`,
      "",
      `🕒 Час: ${kyivTime}`,
      "ℹ️ Контекст: У людини не завантажився повний чекаут, потрібен терміновий телефонний зв'язок!",
    ].join("\n")

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: msg,
        }),
      })

      if (!tgRes.ok) {
        const tgErr = await tgRes.json().catch(() => ({}))
        console.error("[fast-order] Telegram send failed:", JSON.stringify(tgErr))
      }
    } catch (err) {
      console.error("[fast-order] Telegram network error:", err)
    }
  } else {
    console.warn("[fast-order] TELEGRAM_BOT_TOKEN або TELEGRAM_ADMIN_TOKEN не задано — повідомлення не надіслано.")
  }

  return NextResponse.json({ ok: true })
}
