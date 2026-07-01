import { NextResponse } from "next/server"
import { sendOrderNotification } from "@/lib/telegram"
import { prisma } from "@/lib/prisma"
import { stripPhoneFormatting } from "@/lib/phone-format"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, productId, productName, price } = body

    if (!name?.trim() || !phone?.trim() || !productId) {
      return NextResponse.json({ error: "Ім'я, телефон та товар обов'язкові" }, { status: 400 })
    }

    const cleanPhone = stripPhoneFormatting(phone)

    // Create user if not exists
    let user = await prisma.user.findUnique({ where: { phone: cleanPhone } })
    if (!user) {
      const { hashPassword } = await import("@/lib/password")
      const defaultPassword = cleanPhone.replace(/\D/g, "").slice(-6) || "000000"
      user = await prisma.user.create({
        data: { phone: cleanPhone, name: name.trim(), password: hashPassword(defaultPassword) },
      })
    }

    // Create quick order
    const order = await prisma.order.create({
      data: {
        orderNumber: `quick-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        total: price || 0,
        status: "NEW",
        paymentType: "cod",
        paymentStatus: "UNPAID",
        items: `${productName} x1`,
        orderItems: [{ productId, quantity: 1 }],
        delivery: "Уточнюється",
        userId: user.id,
        comment: "⚡ Швидке замовлення",
      },
    })

    // Notify Telegram
    try {
      await sendOrderNotification({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        user: { phone: user.phone, name: user.name },
        cityName: "",
        deliveryPoint: "",
        items: order.items,
        comment: order.comment || "",
        paymentType: order.paymentType,
        noCall: false,
      })
    } catch (e) {
      console.error("[quick-order] Telegram notification failed:", e)
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (e) {
    console.error("[quick-order] Error:", e)
    return NextResponse.json({ error: "Не вдалося створити замовлення" }, { status: 500 })
  }
}
