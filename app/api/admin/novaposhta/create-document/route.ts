import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"
import { createRecipient, createDocument, updateCounterpartyName } from "@/lib/novaposhta"
import { sendTtnNotification } from "@/lib/telegram"

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  let body: {
    orderId: number
    recipientCityRef: string
    recipientAddressRef: string
    recipientName: string
    recipientPhone: string
    weight: number
    seatsAmount: number
    description: string
    cost: number
    backwardDeliveryRedeliveryString?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const {
    orderId,
    recipientCityRef,
    recipientAddressRef,
    recipientName,
    recipientPhone,
    weight,
    seatsAmount,
    description,
    cost,
    backwardDeliveryRedeliveryString,
  } = body

  if (!orderId || !recipientCityRef || !recipientAddressRef || !recipientName || !recipientPhone) {
    return NextResponse.json(
      { error: "Missing required fields: orderId, recipientCityRef, recipientAddressRef, recipientName, recipientPhone" },
      { status: 400 }
    )
  }

  const senderRef = process.env.NP_SENDER_REF ?? ""
  const senderCityRef = process.env.NP_SENDER_CITY_REF ?? ""
  const senderAddressRef = process.env.NP_SENDER_ADDRESS_REF ?? ""
  const senderContactRef = process.env.NP_SENDER_CONTACT_REF ?? ""
  const senderPhone = process.env.NP_SENDER_PHONE ?? ""

  if (!senderRef || !senderCityRef || !senderAddressRef || !senderContactRef || !senderPhone) {
    return NextResponse.json(
      {
        error:
          "Не настроены данные отправителя. Задайте NP_SENDER_REF, NP_SENDER_CITY_REF, NP_SENDER_ADDRESS_REF, NP_SENDER_CONTACT_REF, NP_SENDER_PHONE в .env",
      },
      { status: 500 }
    )
  }

  try {
    // Fetch order number for NP fields
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    })
    const orderNumber = order?.orderNumber ?? String(orderId)

    // Ensure sender counterparty shows as "OZO" in "Створено через"
    updateCounterpartyName(senderRef, "OZO").catch((err) =>
      console.error("[create-document] Sender rename FAILED:", err instanceof Error ? err.message : err)
    )

    const { recipientRef, contactRef: recipientContactRef } = await createRecipient(
      recipientName,
      recipientPhone
    )

    const doc = await createDocument({
      senderRef,
      senderCityRef,
      senderAddressRef,
      senderContactRef,
      senderPhone,
      recipientRef,
      recipientCityRef,
      recipientAddressRef,
      recipientContactRef,
      recipientName,
      recipientPhone,
      weight: weight ?? 1,
      seatsAmount: seatsAmount ?? 1,
      description: description ?? "Товари",
      cost: cost ?? 0,
      backwardDeliveryRedeliveryString,
      infoRegClientBarcodes: orderNumber,
      additionalInformation: `Заказ #${orderNumber}`,
    })

    await prisma.order.update({
      where: { id: orderId },
      data: { ttn: doc.IntDocNumber },
    })

    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        ttn: true,
        total: true,
        items: true,
        orderItems: true,
        paymentType: true,
        user: { select: { phone: true, name: true } },
      },
    })

    if (updatedOrder && updatedOrder.ttn) {
      sendTtnNotification(updatedOrder as any).catch((err) =>
        console.error("[create-document] TTN notification failed:", err)
      )
    }

    return NextResponse.json({
      ttn: doc.IntDocNumber,
      ref: doc.Ref,
      estimatedDelivery: doc.EstimatedDeliveryDate,
      costOnSite: doc.CostOnSite,
    })
  } catch (error) {
    console.error("[NP_CREATE_DOCUMENT_ERROR]", error instanceof Error ? error.message : error)
    console.error("  REQUEST BODY:", JSON.stringify(body, null, 2))
    const message = error instanceof Error ? error.message : "Ошибка создания ТТН"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
