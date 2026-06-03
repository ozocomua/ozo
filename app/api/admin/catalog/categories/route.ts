import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"
import { slugify } from "@/lib/slug"

export async function GET() {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  })

  return NextResponse.json({ categories })
}

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name =
    typeof body === "object" && body !== null && "name" in body && typeof (body as { name: unknown }).name === "string"
      ? (body as { name: string }).name.trim()
      : ""
  const rawSlug =
    typeof body === "object" && body !== null && "slug" in body && typeof (body as { slug: unknown }).slug === "string"
      ? (body as { slug: string }).slug.trim()
      : ""
  const description =
    typeof body === "object" &&
    body !== null &&
    "description" in body &&
    typeof (body as { description: unknown }).description === "string"
      ? (body as { description: string }).description.trim()
      : ""
  const imageUrl =
    typeof body === "object" && body !== null && "imageUrl" in body && typeof (body as { imageUrl: unknown }).imageUrl === "string"
      ? (body as { imageUrl: string }).imageUrl.trim()
      : ""
  const parentIdRaw =
    typeof body === "object" && body !== null && "parentId" in body ? (body as { parentId?: unknown }).parentId : null
  const parentId = typeof parentIdRaw === "number" && Number.isFinite(parentIdRaw) ? parentIdRaw : null

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const slug = rawSlug || slugify(name)

  try {
    const created = await prisma.category.create({
      data: {
        name: name.slice(0, 120),
        slug: slug.slice(0, 191),
        description: description.slice(0, 500),
        imageUrl: imageUrl.slice(0, 500),
        parentId,
      },
      select: { id: true },
    })
    return NextResponse.json({ id: created.id })
  } catch {
    return NextResponse.json({ error: "Failed to create category" }, { status: 400 })
  }
}

