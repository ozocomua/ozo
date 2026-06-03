import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function PATCH(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  let body: { id: number; vol: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { id, vol } = body
  if (!id || typeof id !== "number" || vol === undefined || vol === null) {
    return NextResponse.json({ error: "id and vol required" }, { status: 400 })
  }

  try {
    const updated = await prisma.calculatorProduct.update({
      where: { id },
      data: { vol },
    })
    return NextResponse.json({ id: updated.id, vol: updated.vol })
  } catch (error) {
    console.error("CALC_PRODUCT_UPDATE_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося оновити" }, { status: 500 })
  }
}
