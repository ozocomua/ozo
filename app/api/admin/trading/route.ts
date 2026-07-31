import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const pairs = await prisma.tradingPair.findMany({
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  })
  return NextResponse.json({ pairs })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { symbol, name, chartStatus, priority, notes, tags } = body

  if (!symbol?.trim()) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  const existing = await prisma.tradingPair.findUnique({ where: { symbol: symbol.trim().toUpperCase() } })
  if (existing) {
    return NextResponse.json({ error: "Ця пара вже є" }, { status: 400 })
  }

  const pair = await prisma.tradingPair.create({
    data: {
      symbol: symbol.trim().toUpperCase(),
      name: name?.trim() || null,
      chartStatus: chartStatus || "UNCLEAR",
      priority: Number(priority) || 0,
      notes: notes?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
    },
  })

  return NextResponse.json({ success: true, pair })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, symbol, name, chartStatus, priority, notes, tags } = body

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await prisma.tradingPair.update({
    where: { id: Number(id) },
    data: {
      symbol: symbol?.trim()?.toUpperCase(),
      name: name?.trim() || null,
      chartStatus: chartStatus || undefined,
      priority: priority !== undefined ? Number(priority) : undefined,
      notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      tags: tags !== undefined ? tags : undefined,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await prisma.tradingPair.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
