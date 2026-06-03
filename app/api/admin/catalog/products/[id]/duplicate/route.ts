import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const productId = parseId(id)
  if (!productId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const src = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      categories: { select: { categoryId: true } },
      variants: { select: { sku: true, volume: true, packageType: true, priceRetail: true, priceWholesale: true, stock: true } },
      images: { select: { url: true, alt: true, sort: true } },
    },
  })

  if (!src) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const baseSlug = `${src.slug}-copy`
  const slug = `${baseSlug}-${Date.now()}`

  try {
    const created = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: src.name,
          slug: slug.slice(0, 191),
          description: src.description,
          fullDescription: src.fullDescription,
          badge: src.badge,
          isPublished: false,
          brandId: src.brandId,
        },
        select: { id: true },
      })

      if (src.categories.length) {
        await tx.productCategory.createMany({
          data: src.categories.map((c) => ({ productId: p.id, categoryId: c.categoryId })),
          skipDuplicates: true,
        })
      }

      if (src.variants.length) {
        await tx.productVariant.createMany({
          data: src.variants.map((v) => ({
            sku: `${v.sku}-copy-${Math.random().toString(36).slice(2, 6)}`.slice(0, 191),
            volume: v.volume,
            packageType: v.packageType,
            priceRetail: v.priceRetail,
            priceWholesale: v.priceWholesale,
            stock: 0,
            productId: p.id,
          })),
        })
      }

      if (src.images.length) {
        await tx.productImage.createMany({
          data: src.images.map((img) => ({ ...img, productId: p.id })),
        })
      }

      return p
    })

    return NextResponse.json({ id: created.id })
  } catch {
    return NextResponse.json({ error: "Failed to duplicate product" }, { status: 400 })
  }
}

