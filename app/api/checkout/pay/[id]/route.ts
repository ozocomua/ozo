import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const orderId = parseInt(id, 10)
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Некоректний ID замовлення" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      delivery: true,
      items: true,
      paymentType: true,
      paymentStatus: true,
      paymentUrl: true,
      noCall: true,
      user: { select: { name: true, phone: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 })
  }

  return NextResponse.json({
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    delivery: order.delivery,
    items: order.items,
    paymentType: order.paymentType,
    paymentStatus: order.paymentStatus,
    paymentUrl: order.paymentUrl,
    noCall: order.noCall,
    userName: order.user.name || "Клієнт",
    phone: order.user.phone,
  })
}
