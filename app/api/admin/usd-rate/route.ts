import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

// Отримує актуальний курс долара з НБУ та зберігає його в налаштуваннях фінансів
export async function POST() {
  const guard = await requireAdminOr401()
  if (guard) return guard

  try {
    const res = await fetch(
      "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json",
      { cache: "no-store", headers: { accept: "application/json" } },
    )
    if (!res.ok) throw new Error("NBU unavailable")

    const data = (await res.json()) as Array<{ rate?: number | string }>
    const raw = data?.[0]?.rate
    const parsed = typeof raw === "string" ? parseFloat(raw) : raw
    const rate = typeof parsed === "number" && Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null
    if (!rate) throw new Error("bad rate")

    const row = await prisma.financeSettings.findFirst()
    if (row) {
      await prisma.financeSettings.update({ where: { id: row.id }, data: { usdRate: rate } })
    } else {
      await prisma.financeSettings.create({
        data: { usdRate: rate, targetProfit: 30000, targetRevenue: 80000 },
      })
    }

    return NextResponse.json({ rate })
  } catch {
    return NextResponse.json({ error: "Не вдалося отримати курс НБУ" }, { status: 502 })
  }
}
