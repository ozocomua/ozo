import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  const { pairId, direction, entryPrice, exitPrice, sl, tp, lots, pnl, result, setup, screenshot, emotions, notes, enteredAt, exitedAt } = body

  if (!pairId || entryPrice === undefined) {
    return NextResponse.json({ error: "pairId, entryPrice required" }, { status: 400 })
  }

  const trade = await prisma.trade.create({
    data: {
      pairId: Number(pairId),
      direction: direction || "LONG",
      entryPrice: Number(entryPrice),
      exitPrice: exitPrice ? Number(exitPrice) : null,
      sl: sl ? Number(sl) : null,
      tp: tp ? Number(tp) : null,
      lots: lots ? Number(lots) : 1,
      pnl: pnl !== undefined ? Number(pnl) : null,
      result: result || "OPEN",
      setup: setup?.trim() || null,
      screenshot: screenshot?.trim() || null,
      emotions: emotions?.trim() || null,
      notes: notes?.trim() || null,
      enteredAt: enteredAt ? new Date(enteredAt) : new Date(),
      exitedAt: exitedAt ? new Date(exitedAt) : null,
    },
  })

  return NextResponse.json({ success: true, trade })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, exitPrice, pnl, result, setup, screenshot, emotions, notes, exitedAt } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const data: any = {}
  if (exitPrice !== undefined) data.exitPrice = Number(exitPrice)
  if (pnl !== undefined) data.pnl = Number(pnl)
  if (result !== undefined) data.result = result
  if (setup !== undefined) data.setup = setup?.trim() || null
  if (screenshot !== undefined) data.screenshot = screenshot?.trim() || null
  if (emotions !== undefined) data.emotions = emotions?.trim() || null
  if (notes !== undefined) data.notes = notes?.trim() || null
  if (exitedAt !== undefined) data.exitedAt = exitedAt ? new Date(exitedAt) : new Date()
  if (result === "WIN" || result === "LOSS" || result === "BE") data.exitedAt = data.exitedAt || new Date()

  await prisma.trade.update({ where: { id: Number(id) }, data })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await prisma.trade.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
