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
  const categoryId = parseId(id)
  if (!categoryId) {
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
    if (name) data.name = name.slice(0, 120)
  }

  if (typeof body === "object" && body !== null && "slug" in body) {
    const slug = typeof (body as { slug?: unknown }).slug === "string" ? (body as { slug: string }).slug.trim() : ""
    if (slug) data.slug = slug.slice(0, 191)
  }

  if (typeof body === "object" && body !== null && "description" in body) {
    const description =
      typeof (body as { description?: unknown }).description === "string"
        ? (body as { description: string }).description.trim()
        : ""
    data.description = description.slice(0, 500)
  }

  if (typeof body === "object" && body !== null && "imageUrl" in body) {
    const imageUrl =
      typeof (body as { imageUrl?: unknown }).imageUrl === "string"
        ? (body as { imageUrl: string }).imageUrl.trim()
        : ""
    data.imageUrl = imageUrl.slice(0, 500)
  }

  if (typeof body === "object" && body !== null && "parentId" in body) {
    const raw = (body as { parentId?: unknown }).parentId
    const parentId = typeof raw === "number" && Number.isFinite(raw) ? raw : null
    data.parentId = parentId
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  try {
    await prisma.category.update({
      where: { id: categoryId },
      data,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to update category" }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const categoryId = parseId(id)
  if (!categoryId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const usage = await prisma.productCategory.count({ where: { categoryId } })
  if (usage) {
    return NextResponse.json({ error: "Category has products" }, { status: 409 })
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 400 })
  }
}

