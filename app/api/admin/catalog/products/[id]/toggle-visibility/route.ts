import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const productId = Number(id)
  if (!Number.isFinite(productId) || productId < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isPublished: true },
  })

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { isPublished: !product.isPublished },
    select: { id: true, isPublished: true },
  })

  return NextResponse.json({ success: true, isPublished: updated.isPublished })
}
