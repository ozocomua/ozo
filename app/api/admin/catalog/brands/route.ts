import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function GET() {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const brands = await prisma.brand.findMany({
    select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ brands })
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
  const slug =
    typeof body === "object" && body !== null && "slug" in body && typeof (body as { slug: unknown }).slug === "string"
      ? (body as { slug: string }).slug.trim()
      : ""

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
  }

  try {
    const created = await prisma.brand.create({
      data: { name: name.slice(0, 191), slug: slug.slice(0, 191) },
      select: { id: true },
    })
    return NextResponse.json({ id: created.id })
  } catch {
    return NextResponse.json({ error: "Failed to create brand" }, { status: 400 })
  }
}

