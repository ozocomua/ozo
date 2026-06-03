import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function GET() {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const [sales, settingsRow] = await Promise.all([
    prisma.financeSale.findMany({ orderBy: { timestamp: "desc" } }),
    prisma.financeSettings.findFirst(),
  ])

  const settings = settingsRow
    ? { usdRate: settingsRow.usdRate, targetProfit: settingsRow.targetProfit, targetRevenue: settingsRow.targetRevenue }
    : { usdRate: 41.5, targetProfit: 30000, targetRevenue: 80000 }

  return NextResponse.json({
    sales: sales.map((s) => ({
      id: s.id,
      timestamp: Number(s.timestamp),
      date: s.date,
      type: s.type,
      status: s.status,
      comment: s.comment,
      items: s.items,
    })),
    settings,
  })
}

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const body = await req.json()

  await prisma.$transaction(async (tx) => {
    if (body.sales !== undefined) {
      await tx.financeSale.deleteMany()
      if (body.sales.length) {
        await tx.financeSale.createMany({
          data: body.sales.map((s: any) => ({
            timestamp: BigInt(s.timestamp),
            date: s.date,
            type: s.type ?? "sale",
            status: s.status ?? "transit",
            comment: s.comment ?? "",
            items: s.items ?? [],
          })),
        })
      }
    }

    if (body.settings) {
      await tx.financeSettings.deleteMany()
      await tx.financeSettings.create({
        data: {
          usdRate: body.settings.usdRate ?? 41.5,
          targetProfit: body.settings.targetProfit ?? 30000,
          targetRevenue: body.settings.targetRevenue ?? 80000,
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}
