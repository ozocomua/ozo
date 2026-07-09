import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

// We don't stream SSE here — we receive a URL, fetch it, process, and return stats.
// The frontend polls or we send progress via a simple approach.

interface SandiJson {
  date?: string
  categories?: Record<string, { parent_ref: string | null; name: { uk: string; ru: string }; image?: string }>
  brands?: Record<string, { name: string; image?: string }>
  attributes?: Record<string, { uk: string; ru: string }>
  products?: Record<string, {
    main: {
      sku: string
      barcode?: string
      name: { uk: string; ru: string }
      vendorCode?: string
      description?: { uk: string; ru: string }
      brand?: string
      category?: string
      prices: {
        retail: { current: string; old: string | null }
        purchase?: { cash?: { current: string; old: string | null } }
      }
      balance: number
      balances?: Record<string, number>
    }
    attributes?: Record<string, { uk: string; ru: string }>
    images?: {
      main?: string
      additional?: Record<string, string>
    }
  }>
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  let body: { url?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const url = body.url?.trim()
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 })

  console.log("[import] Fetching:", url)
  const fetchRes = await fetch(url, { 
    headers: { "User-Agent": "OZO-Import/1.0" },
    signal: AbortSignal.timeout(120_000),
  })
  if (!fetchRes.ok) return NextResponse.json({ error: `HTTP ${fetchRes.status} from source` }, { status: 400 })

  const raw = await fetchRes.text()
  console.log(`[import] Downloaded ${raw.length} bytes`)

  let data: SandiJson
  try { data = JSON.parse(raw) } catch {
    return NextResponse.json({ error: "Invalid JSON from source" }, { status: 400 })
  }

  const stats = {
    categories: { created: 0, skipped: 0 },
    brands: { created: 0, skipped: 0 },
    products: { created: 0, updated: 0, skipped: 0 },
  }

  // ── 1. Import brands ──
  const brandIdByUuid = new Map<string, number>()
  if (data.brands) {
    for (const [uuid, b] of Object.entries(data.brands)) {
      try {
        const existing = await prisma.brand.findFirst({ where: { name: b.name }, select: { id: true } })
        if (existing) {
          brandIdByUuid.set(uuid, existing.id)
          stats.brands.skipped++
        } else {
          const created = await prisma.brand.create({ data: { name: b.name } })
          brandIdByUuid.set(uuid, created.id)
          stats.brands.created++
        }
      } catch (e) {
        console.error(`[import] Brand error: ${b.name}`, e)
      }
    }
  }

  // ── 2. Import categories (topological sort — parents first) ──
  const categoryIdByUuid = new Map<string, number>()
  if (data.categories) {
    const catEntries = Object.entries(data.categories)
    // Build parent-child graph
    const catData = catEntries.map(([uuid, c]) => ({ uuid, ...c, slug: slugify(c.name.uk) }))
    const byUuid = new Map(catData.map(c => [c.uuid, c]))

    // Recursive insert (parents first)
    async function ensureCategory(uuid: string): Promise<number> {
      if (categoryIdByUuid.has(uuid)) return categoryIdByUuid.get(uuid)!
      const c = byUuid.get(uuid)
      if (!c) throw new Error(`Category not found: ${uuid}`)

      let parentId: number | null = null
      if (c.parent_ref && byUuid.has(c.parent_ref)) {
        parentId = await ensureCategory(c.parent_ref)
      }

      // Try to find existing by slug
      const existing = await prisma.category.findUnique({ where: { slug: c.slug }, select: { id: true } })
      if (existing) {
        categoryIdByUuid.set(uuid, existing.id)
        stats.categories.skipped++
        return existing.id
      }

      const created = await prisma.category.create({
        data: { name: c.name.uk, slug: c.slug, parentId, imageUrl: c.image },
      })
      categoryIdByUuid.set(uuid, created.id)
      stats.categories.created++
      return created.id
    }

    for (const [uuid] of catEntries) {
      try {
        await ensureCategory(uuid)
      } catch (e) {
        console.error(`[import] Category error: ${uuid}`, e)
      }
    }
  }

  // ── 3. Import products ──
  if (data.products) {
    const productEntries = Object.entries(data.products)
    const BATCH_SIZE = 50
    
    for (let i = 0; i < productEntries.length; i += BATCH_SIZE) {
      const batch = productEntries.slice(i, i + BATCH_SIZE)
      
      for (const [uuid, p] of batch) {
        try {
          const main = p.main
          const sku = main.sku.trim()
          const name = main.name.uk || main.name.ru
          const description = main.description?.uk || main.description?.ru || ""
          const vendorCode = main.vendorCode || ""
          const price = parseFloat(main.prices.retail.current) || 0
          const oldPrice = main.prices.retail.old ? parseFloat(main.prices.retail.old) : null
          const stock = main.balance ?? 0
          const brandId = main.brand ? (brandIdByUuid.get(main.brand) ?? null) : null
          const categoryUuid = main.category
          const categoryId = categoryUuid ? (categoryIdByUuid.get(categoryUuid) ?? null) : null
          const slug = slugify(`${name}-${vendorCode || sku}`).slice(0, 190) || `product-${sku}`

          // Collect attributes
          let fullDescription = description
          if (p.attributes) {
            const attrLines: string[] = []
            for (const [, av] of Object.entries(p.attributes)) {
              const val = av.uk || av.ru
              if (val && val.length < 150) attrLines.push(val)
            }
            if (attrLines.length) {
              fullDescription += "\n\n" + attrLines.join("\n")
            }
          }

          const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } })

          if (existing) {
            // Update price, stock, brand, category
            await prisma.product.update({
              where: { id: existing.id },
              data: { price, oldPrice, stock: stock > 0 ? stock : undefined, brandId: brandId ?? undefined },
            })
            // Upsert category link
            if (categoryId) {
              await prisma.productCategory.upsert({
                where: { productId_categoryId: { productId: existing.id, categoryId } },
                update: { isMain: true },
                create: { productId: existing.id, categoryId, isMain: true },
              })
            }
            stats.products.updated++
          } else {
            const product = await prisma.product.create({
              data: {
                name,
                sku,
                slug,
                description: description.slice(0, 400),
                fullDescription: fullDescription.slice(0, 5000),
                price,
                oldPrice,
                stock,
                brandId,
                isPublished: true,
              },
            })

            // Category link
            if (categoryId) {
              await prisma.productCategory.create({
                data: { productId: product.id, categoryId, isMain: true },
              })
            }

            // Create default variant
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                sku,
                volume: "",
                packageType: "",
                priceRetail: price,
                stock,
              },
            })

            // Images
            const images: { url: string; alt: string; sort: number; isMain: boolean }[] = []
            if (p.images?.main) {
              images.push({ url: p.images.main, alt: name, sort: 0, isMain: true })
            }
            if (p.images?.additional) {
              let sort = 1
              for (const [, imgUrl] of Object.entries(p.images.additional)) {
                images.push({ url: imgUrl, alt: name, sort, isMain: false })
                sort++
              }
            }
            if (images.length) {
              await prisma.productImage.createMany({
                data: images.map(img => ({ ...img, productId: product.id })),
              })
            }

            stats.products.created++
          }
        } catch (e) {
          console.error(`[import] Product error: ${p.main?.sku}`, e)
        }
      }
      console.log(`[import] Progress: ${Math.min(i + BATCH_SIZE, productEntries.length)}/${productEntries.length}`)
    }
  }

  return NextResponse.json({ success: true, stats })
}
