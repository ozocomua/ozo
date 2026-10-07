import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function GET() {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const [entries, products] = await Promise.all([
    prisma.profitEntry.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      productName: e.productName,
      amount: e.amount,
      qty: e.qty,
      comment: e.comment,
      createdAt: e.createdAt,
    })),
    products,
  })
}

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const productName = String(body.productName || "").trim()
  const amount = parseFloat(body.amount)
  const qty = Math.max(1, parseInt(body.qty, 10) || 1)
  const comment = String(body.comment || "").trim() || null

  if (!productName || Number.isNaN(amount)) {
    return NextResponse.json({ error: "Вкажіть товар і суму" }, { status: 400 })
  }

  const entry = await prisma.profitEntry.create({
    data: { productName, amount, qty, comment },
  })

  return NextResponse.json({ ok: true, entry })
}

export async function DELETE(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: "Немає id" }, { status: 400 })

  await prisma.profitEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
