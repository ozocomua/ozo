import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.landingPage.findUnique({ where: { id: Number(id) }, select: { isPublished: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.landingPage.update({
    where: { id: Number(id) },
    data: { isPublished: !existing.isPublished },
  })
  return NextResponse.json({ success: true })
}
