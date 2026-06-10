import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const productId = parseId(id)
  if (!productId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      fullDescription: true,
      badge: true,
      isPublished: true,
      isPopular: true,
      relatedIds: true,
      brandId: true,
      categories: { select: { categoryId: true } },
      variants: { select: { id: true, sku: true, volume: true, packageType: true, priceRetail: true, priceWholesale: true, stock: true }, orderBy: { id: "asc" } },
      images: { select: { id: true, url: true, alt: true, sort: true }, orderBy: { sort: "asc" } },
    },
  })

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    product: {
      ...product,
      categoryIds: product.categories.map((c) => c.categoryId),
    },
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const productId = parseId(id)
  if (!productId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

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
      : null

  const variants =
    "variants" in body && Array.isArray((body as { variants?: unknown }).variants)
      ? ((body as { variants: unknown[] }).variants as unknown[])
      : null

  const images =
    "images" in body && Array.isArray((body as { images?: unknown }).images)
      ? ((body as { images: unknown[] }).images as unknown[])
      : null

  const name = product && typeof product.name === "string" ? product.name.trim() : null
  const slug = product && typeof product.slug === "string" ? product.slug.trim() : null
  const description = product && typeof product.description === "string" ? product.description.trim() : null
  const fullDescription = product && typeof product.fullDescription === "string" ? product.fullDescription.trim() : null
  const badge = product && typeof product.badge === "string" ? product.badge.trim() : null
  const isPublished = product && typeof product.isPublished === "boolean" ? product.isPublished : null
  const isPopular = product && typeof (product as Record<string, unknown>).isPopular === "boolean" ? (product as Record<string, unknown>).isPopular as boolean : null
  const rawRelatedIds = product ? (product as Record<string, unknown>).relatedIds : undefined
  const relatedIds =
    typeof rawRelatedIds !== "undefined" && Array.isArray(rawRelatedIds)
      ? (rawRelatedIds.map((v) => Number(v)).filter((v) => Number.isFinite(v) && !Number.isNaN(v)) as number[])
      : undefined
  const brandIdRaw = product ? product.brandId : undefined
  const brandId =
    typeof brandIdRaw === "number" && Number.isFinite(brandIdRaw) ? brandIdRaw : brandIdRaw === null ? null : undefined
  const oldPriceRaw = product ? (product as Record<string, unknown>).oldPrice : undefined
  const oldPrice =
    typeof oldPriceRaw === "number" || oldPriceRaw === null ? oldPriceRaw : undefined

  const productData: Record<string, unknown> = {}
  if (name !== null) productData.name = name.slice(0, 160)
  if (slug !== null) productData.slug = slug.slice(0, 191)
  if (description !== null) productData.description = description.slice(0, 400)
  if (fullDescription !== null) productData.fullDescription = fullDescription
  if (badge !== null) productData.badge = badge ? badge.slice(0, 60) : null
  if (isPublished !== null) productData.isPublished = isPublished
  if (isPopular !== null) productData.isPopular = isPopular
  if (typeof relatedIds !== "undefined") productData.relatedIds = relatedIds as any
  if (typeof brandId !== "undefined") productData.brandId = brandId
  if (typeof oldPrice !== "undefined") productData.oldPrice = oldPrice

  const parsedVariants =
    variants === null
      ? null
      : (variants
          .map((v) => {
            if (typeof v !== "object" || v === null) return null
            const existingIdRaw = (v as { id?: unknown }).id
            const id = typeof existingIdRaw === "number" && Number.isFinite(existingIdRaw) ? existingIdRaw : null
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
              id,
              sku: sku.slice(0, 191),
              volume: volume.slice(0, 40),
              packageType: packageType.slice(0, 40),
              priceRetail,
              priceWholesale: Number.isFinite(priceWholesale as number) ? (priceWholesale as number) : null,
              stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
            }
          })
          .filter(Boolean) as Array<{
          id: number | null
          sku: string
          volume: string
          packageType: string
          priceRetail: number
          priceWholesale: number | null
          stock: number
        }>)

  const parsedImages =
    images === null
      ? null
      : (images
          .map((v, idx) => {
            if (typeof v !== "object" || v === null) return null
            const existingIdRaw = (v as { id?: unknown }).id
            const id = typeof existingIdRaw === "number" && Number.isFinite(existingIdRaw) ? existingIdRaw : null
            const url = typeof (v as { url?: unknown }).url === "string" ? (v as { url: string }).url.trim() : ""
            const alt = typeof (v as { alt?: unknown }).alt === "string" ? (v as { alt: string }).alt.trim() : ""
            const sortRaw = (v as { sort?: unknown }).sort
            const sort = Number.isFinite(Number(sortRaw)) ? Number(sortRaw) : idx
            if (!url) return null
            return { id, url: url.slice(0, 500), alt: alt.slice(0, 200), sort }
          })
          .filter(Boolean) as Array<{ id: number | null; url: string; alt: string; sort: number }>)

  if (
    !Object.keys(productData).length &&
    categoryIds === null &&
    parsedVariants === null &&
    parsedImages === null
  ) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (Object.keys(productData).length) {
        await tx.product.update({ where: { id: productId }, data: productData })
      }

      if (Array.isArray(categoryIds)) {
        await tx.productCategory.deleteMany({ where: { productId } })
        if (categoryIds.length) {
          await tx.productCategory.createMany({
            data: categoryIds.slice(0, 30).map((categoryId) => ({ productId, categoryId })),
            skipDuplicates: true,
          })
        }
      }

      if (Array.isArray(parsedVariants)) {
        await tx.productVariant.deleteMany({ where: { productId } })
        if (!parsedVariants.length) {
          throw new Error("No variants")
        }
        await tx.productVariant.createMany({
          data: parsedVariants.map((v) => ({
            sku: v.sku,
            volume: v.volume,
            packageType: v.packageType,
            priceRetail: v.priceRetail,
            priceWholesale: v.priceWholesale,
            stock: v.stock,
            productId,
          })),
        })
        // Auto-set product.price to the cheapest variant
        const minPrice = Math.min(...parsedVariants.map((v) => v.priceRetail))
        await tx.product.update({
          where: { id: productId },
          data: { price: minPrice },
        })
      }

      if (Array.isArray(parsedImages)) {
        await tx.productImage.deleteMany({ where: { productId } })
        if (parsedImages.length) {
          await tx.productImage.createMany({
            data: parsedImages.map((img) => ({ url: img.url, alt: img.alt, sort: img.sort, productId })),
          })
        }
      }
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const productId = parseId(id)
  if (!productId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  try {
    await prisma.product.delete({ where: { id: productId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 400 })
  }
}

