import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const pairs = await prisma.tradingPair.findMany({
    orderBy: [{ groupName: "asc" }, { symbol: "asc" }],
    include: { trades: { orderBy: { enteredAt: "desc" } } },
  })
  const config = await prisma.ftmoConfig.findFirst({ orderBy: { id: "desc" } })
  return NextResponse.json({ pairs, config })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, chartStatus, priority, notes, tags, bias, support, resistance, tvLink, dailyNotes, sessions } = body

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const data: any = {}
  if (chartStatus !== undefined) data.chartStatus = chartStatus
  if (priority !== undefined) data.priority = Number(priority)
  if (notes !== undefined) data.notes = notes?.trim() || null
  if (tags !== undefined) data.tags = tags
  if (bias !== undefined) data.bias = bias
  if (support !== undefined) data.support = support === "" ? null : support ? Number(support) : undefined
  if (resistance !== undefined) data.resistance = resistance === "" ? null : resistance ? Number(resistance) : undefined
  if (tvLink !== undefined) data.tvLink = tvLink?.trim() || null
  if (dailyNotes !== undefined) { data.dailyNotes = dailyNotes?.trim() || null; data.dailyNotesDate = new Date() }
  if (sessions !== undefined) data.sessions = sessions

  await prisma.tradingPair.update({ where: { id: Number(id) }, data })
  return NextResponse.json({ success: true })
}
