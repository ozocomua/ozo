import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  const { productName, price, qty, slug, name, phone } = body

  if (!phone?.trim()) {
    return NextResponse.json({ error: "Телефон обов'язковий" }, { status: 400 })
  }

  // Save as CallbackRequest — simplest, no userId required
  await prisma.callbackRequest.create({
    data: {
      name: name?.trim() || "Лендінг",
      phone: phone.trim(),
      comment: `Лендінг /lp/${slug || ''} — ${productName || 'Товар'} × ${qty || 1} — ${Number(price) || 0} грн`,
      status: "PENDING",
    },
  })

  return NextResponse.json({ success: true })
}
