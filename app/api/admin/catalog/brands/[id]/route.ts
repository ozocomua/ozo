import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const brandId = parseId(id)
  if (!brandId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (typeof body === "object" && body !== null && "name" in body) {
    const name = typeof (body as { name?: unknown }).name === "string" ? (body as { name: string }).name.trim() : ""
    if (name) data.name = name.slice(0, 191)
  }

  if (typeof body === "object" && body !== null && "slug" in body) {
    const slug = typeof (body as { slug?: unknown }).slug === "string" ? (body as { slug: string }).slug.trim() : ""
    if (slug) data.slug = slug.slice(0, 191)
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  try {
    await prisma.brand.update({ where: { id: brandId }, data })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to update brand" }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const brandId = parseId(id)
  if (!brandId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const usage = await prisma.product.count({ where: { brandId } })
  if (usage) {
    return NextResponse.json({ error: "Brand has products" }, { status: 409 })
  }

  try {
    await prisma.brand.delete({ where: { id: brandId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 400 })
  }
}

