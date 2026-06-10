import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function GET(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""
  const categoryIdRaw = url.searchParams.get("categoryId")
  const brandIdRaw = url.searchParams.get("brandId")
  const publishedRaw = url.searchParams.get("published")

  const categoryId = categoryIdRaw ? Number(categoryIdRaw) : null
  const brandId = brandIdRaw ? Number(brandIdRaw) : null
  const published =
    publishedRaw === "true" ? true : publishedRaw === "false" ? false : null

  const where: Parameters<typeof prisma.product.findMany>[0]["where"] = {}

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { slug: { contains: q } },
      { variants: { some: { sku: { contains: q } } } },
    ]
  }

  if (Number.isFinite(categoryId as number)) {
    where.categories = { some: { categoryId: categoryId as number } }
  }

  if (Number.isFinite(brandId as number)) {
    where.brandId = brandId as number
  }

  if (published !== null) {
    where.isPublished = published
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      badge: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      brand: { select: { id: true, name: true } },
      categories: { select: { category: { select: { id: true, name: true, parentId: true } } } },
      variants: { select: { id: true, sku: true, volume: true, packageType: true, priceRetail: true, stock: true }, orderBy: { id: "asc" } },
      images: { select: { id: true, url: true, sort: true }, orderBy: { sort: "asc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  })

  return NextResponse.json({ products })
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

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const product = "product" in body && typeof (body as { product?: unknown }).product === "object" && (body as { product?: unknown }).product !== null
    ? ((body as { product: Record<string, unknown> }).product as Record<string, unknown>)
    : null

  const categoryIds =
    "categoryIds" in body && Array.isArray((body as { categoryIds?: unknown }).categoryIds)
      ? ((body as { categoryIds: unknown[] }).categoryIds
          .map((v) => Number(v))
          .filter((v) => Number.isFinite(v)) as number[])
      : []

  const variants =
    "variants" in body && Array.isArray((body as { variants?: unknown }).variants)
      ? ((body as { variants: unknown[] }).variants as unknown[])
      : []

  const images =
    "images" in body && Array.isArray((body as { images?: unknown }).images)
      ? ((body as { images: unknown[] }).images as unknown[])
      : []

  const name = product && typeof product.name === "string" ? product.name.trim() : ""
  const slug = product && typeof product.slug === "string" ? product.slug.trim() : ""
  const description = product && typeof product.description === "string" ? product.description.trim() : ""
  const fullDescription = product && typeof product.fullDescription === "string" ? product.fullDescription.trim() : ""
  const badge = product && typeof product.badge === "string" ? product.badge.trim() : ""
  const isPublished = product && typeof product.isPublished === "boolean" ? product.isPublished : false
  const isPopular = product && typeof (product as Record<string, unknown>).isPopular === "boolean" ? (product as Record<string, unknown>).isPopular as boolean : false
  const rawRelatedIds = product ? (product as Record<string, unknown>).relatedIds : null
  const relatedIds: number[] =
    Array.isArray(rawRelatedIds) ? rawRelatedIds.map((v) => Number(v)).filter((v) => Number.isFinite(v) && !Number.isNaN(v)) : []
  const brandIdRaw = product ? product.brandId : null
  const brandId = typeof brandIdRaw === "number" && Number.isFinite(brandIdRaw) ? brandIdRaw : null

  if (!name || !slug || !fullDescription) {
    return NextResponse.json({ error: "name, slug, fullDescription are required" }, { status: 400 })
  }

  const parsedVariants = variants
    .map((v) => {
      if (typeof v !== "object" || v === null) return null
      const sku = typeof (v as { sku?: unknown }).sku === "string" ? (v as { sku: string }).sku.trim() : ""
      const volume = typeof (v as { volume?: unknown }).volume === "string" ? (v as { volume: string }).volume.trim() : ""
      const packageType = typeof (v as { packageType?: unknown }).packageType === "string" ? (v as { packageType: string }).packageType.trim() : ""
      const priceRetail = Number((v as { priceRetail?: unknown }).priceRetail)
      const priceWholesaleRaw = (v as { priceWholesale?: unknown }).priceWholesale
      const priceWholesale =
        priceWholesaleRaw === null || typeof priceWholesaleRaw === "undefined"
          ? null
          : Number(priceWholesaleRaw)
      const stock = Number((v as { stock?: unknown }).stock)

      if (!sku || !volume || !packageType || !Number.isFinite(priceRetail)) return null

      return {
        sku: sku.slice(0, 191),
        volume: volume.slice(0, 40),
        packageType: packageType.slice(0, 40),
        priceRetail,
        priceWholesale: Number.isFinite(priceWholesale as number) ? (priceWholesale as number) : null,
        stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
      }
    })
    .filter(Boolean) as Array<{
    sku: string
    volume: string
    packageType: string
    priceRetail: number
    priceWholesale: number | null
    stock: number
  }>

  if (!parsedVariants.length) {
    return NextResponse.json({ error: "At least one variant is required" }, { status: 400 })
  }

  const parsedImages = images
    .map((v, idx) => {
      if (typeof v !== "object" || v === null) return null
      const url = typeof (v as { url?: unknown }).url === "string" ? (v as { url: string }).url.trim() : ""
      const alt = typeof (v as { alt?: unknown }).alt === "string" ? (v as { alt: string }).alt.trim() : ""
      const sortRaw = (v as { sort?: unknown }).sort
      const sort = Number.isFinite(Number(sortRaw)) ? Number(sortRaw) : idx
      if (!url) return null
      return { url: url.slice(0, 500), alt: alt.slice(0, 200), sort }
    })
    .filter(Boolean) as Array<{ url: string; alt: string; sort: number }>

  try {
    const created = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: name.slice(0, 160),
          slug: slug.slice(0, 191),
          description: description.slice(0, 400),
          fullDescription,
          badge: badge ? badge.slice(0, 60) : null,
          isPublished,
          isPopular,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          relatedIds: relatedIds as any,
          brandId,
        },
        select: { id: true },
      })

      if (categoryIds.length) {
        await tx.productCategory.createMany({
          data: categoryIds.slice(0, 30).map((categoryId) => ({ productId: p.id, categoryId })),
          skipDuplicates: true,
        })
      }

      await tx.productVariant.createMany({
        data: parsedVariants.map((v) => ({ ...v, productId: p.id })),
      })

      // Auto-set product.price to the cheapest variant
      const minPrice = Math.min(...parsedVariants.map((v) => v.priceRetail))
      await tx.product.update({
        where: { id: p.id },
        data: { price: minPrice },
      })

      if (parsedImages.length) {
        await tx.productImage.createMany({
          data: parsedImages.map((img) => ({ ...img, productId: p.id })),
        })
      }

      return p
    })

    return NextResponse.json({ id: created.id })
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 400 })
  }
}

