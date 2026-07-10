import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendLandingOrderNotification } from "@/lib/telegram"

export async function POST(req: Request) {
  const body = await req.json()
  const { productName, price, qty, slug, name, phone } = body

  if (!phone?.trim()) {
    return NextResponse.json({ error: "Телефон обов'язковий" }, { status: 400 })
  }

  // Save as CallbackRequest
  await prisma.callbackRequest.create({
    data: {
      name: name?.trim() || "Лендінг",
      phone: phone.trim(),
      comment: `Лендінг /lp/${slug || ''} — ${productName || 'Товар'} × ${qty || 1} — ${Number(price) || 0} грн`,
      status: "PENDING",
    },
  })

  // Send Telegram notification (fire and forget)
  sendLandingOrderNotification({
    productName: productName || "Товар",
    price: Number(price) || 0,
    name: name || "",
    phone: phone,
    slug: slug || "",
  }).catch(err => console.error("[checkout/direct] Telegram notification failed:", err))

  return NextResponse.json({ success: true })
}
