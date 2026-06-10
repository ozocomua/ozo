import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  let body: { name?: string; phone?: string; comment?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""
  const comment = typeof body.comment === "string" ? body.comment.trim() : ""

  if (!name || !phone) {
    return NextResponse.json({ error: "Ім'я та телефон обов'язкові" }, { status: 400 })
  }

  try {
    const record = await prisma.callbackRequest.create({
      data: { name, phone, comment: comment || null },
    })

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const adminChatId = process.env.TELEGRAM_ADMIN_TOKEN

    if (botToken && adminChatId) {
      const date = new Date(record.createdAt).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

      const msg = [
        "🔔 НОВА ЗАЯВКА НА ДЗВІНОК!",
        "",
        `👤 Ім'я: ${name}`,
        `📞 Телефон: ${phone}`,
        `💬 Коментар: ${comment || "—"}`,
        `📅 Дата: ${date}`,
      ].join("\n")

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: msg,
        }),
      }).catch((err) => console.error("[callback] Telegram send failed:", err))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("CALLBACK_CREATE_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося зберегти заявку" }, { status: 500 })
  }
}
