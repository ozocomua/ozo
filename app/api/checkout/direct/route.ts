import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  const { productName, price, oldPrice, qty, image, slug, name, phone } = body

  if (!phone?.trim()) {
    return NextResponse.json({ error: "Телефон обов'язковий" }, { status: 400 })
  }

  const total = (Number(price) || 0) * (Number(qty) || 1)

  // Save to orders table
  const order = await prisma.order.create({
    data: {
      fullName: name?.trim() || "Лендінг",
      phone: phone.trim(),
      comment: `Лендінг /lp/${slug || ''} — ${productName || 'Товар'} × ${qty || 1}`,
      status: "NEW",
      source: "LANDING",
      orderItems: {
        create: [
          {
            productName: productName || "Товар з лендінгу",
            sku: `LP-${Date.now()}`,
            quantity: Number(qty) || 1,
            price: Number(price) || 0,
            image: image || "",
          },
        ],
      },
    },
  })

  return NextResponse.json({ success: true, orderId: order.id })
}
