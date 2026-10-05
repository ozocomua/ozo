import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendLandingOrderNotification } from "@/lib/telegram"

/**
 * Webhook для TikTok Lead Generation (Instant Forms).
 * TikTok надсилає сюди лідів, а ми:
 *  1) зберігаємо їх у CallbackRequest (видно в адмінці, розділ «Заявки на дзвінок»),
 *  2) одразу відправляємо сповіщення в Telegram.
 *
 * URL для налаштування в TikTok: https://ВАШ_ДОМЕН/api/tiktok/leads
 */

function normalizePhone(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "")
  if (d.length === 10 && d.startsWith("0")) d = "38" + d
  else if (d.length === 9 && d.startsWith("0")) d = "380" + d.slice(1)
  return d
}

function getField(lead: any, keys: string[]): string {
  // плоскі поля: { name: "...", phone: "..." }
  for (const k of keys) {
    const v = lead?.[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  // вкладені поля: { fields: [{ field_name, value }] } або [{ name, field_value }]
  const fields = lead?.fields || lead?.field_data || lead?.answers
  if (Array.isArray(fields)) {
    for (const f of fields) {
      const key = String(f?.field_name || f?.name || f?.key || "").toLowerCase()
      const val = f?.value ?? f?.field_value ?? ""
      if (key && keys.includes(key) && val) return String(val).trim()
    }
  }
  return ""
}

function extractLeads(body: any): any[] {
  if (!body || typeof body !== "object") return []
  const candidates = [body.leads, body.data?.leads, body.payload?.leads, body.data]
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c
  }
  // одиничний лід як об'єкт data
  if (body.data && typeof body.data === "object" && (body.data.name || body.data.phone || body.data.fields)) {
    return [body.data]
  }
  if (body.name || body.phone || body.fields) return [body]
  return []
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const challenge = url.searchParams.get("challenge")
  if (challenge) return new NextResponse(challenge, { status: 200 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  let body: any = null
  try { body = await req.json() } catch { body = null }

  // Верифікація challenge (якщо TikTok шле challenge у body)
  if (body?.challenge && !body?.leads && !body?.data) {
    return new NextResponse(String(body.challenge), { status: 200 })
  }

  const leads = extractLeads(body)
  let processed = 0

  for (const lead of leads) {
    const name = getField(lead, ["name", "full_name", "first_name", "lead_name", "user_name"])
    const phone = normalizePhone(getField(lead, ["user_phone", "phone", "phone_number", "mobile", "telephone", "tel", "contact"]))
    const email = getField(lead, ["user_email", "email", "e_mail", "email_address"])
    if (!phone) continue

    try {
      await prisma.callbackRequest.create({
        data: {
          name: name || "Лід з TikTok",
          phone,
          comment: `TikTok Lead Gen${email ? ` · ${email}` : ""}`,
          status: "PENDING",
        },
      })
    } catch (e) {
      console.error("[tiktok/leads] callbackRequest.create failed:", e)
    }

    sendLandingOrderNotification({
      productName: "Килимок OZO Преміум",
      price: 799,
      name: name || "",
      phone,
      slug: "tiktok-lead",
    }).catch((e) => console.error("[tiktok/leads] telegram failed:", e))

    processed++
  }

  return NextResponse.json({ ok: true, processed })
}
