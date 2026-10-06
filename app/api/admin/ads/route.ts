import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function GET() {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const expenses = await prisma.adExpense.findMany({ orderBy: { createdAt: "desc" } })

  return NextResponse.json({
    expenses: expenses.map((e) => ({
      id: e.id,
      amount: e.amount,
      comment: e.comment,
      createdAt: e.createdAt,
    })),
  })
}

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const amount = parseFloat(body.amount)
  if (Number.isNaN(amount)) {
    return NextResponse.json({ error: "Вкажіть суму" }, { status: 400 })
  }
  const comment = String(body.comment || "").trim() || null

  const expense = await prisma.adExpense.create({ data: { amount, comment } })
  return NextResponse.json({ ok: true, expense })
}

export async function DELETE(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const body = await req.json().catch(() => ({}))
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: "Немає id" }, { status: 400 })

  await prisma.adExpense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
