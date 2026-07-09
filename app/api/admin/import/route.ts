import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

// ── In-memory job store ──
const jobs = new Map<string, {
  status: "running" | "done" | "error"
  progress: number   // 0–100
  total: number
  processed: number
  stats: any | null
  error: string | null
}>()

function jobId() { return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }

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
      prices: { retail: { current: string; old: string | null }; purchase?: { cash?: { current: string; old: string | null } } }
      balance: number
      balances?: Record<string, number>
    }
    attributes?: Record<string, { uk: string; ru: string }>
    images?: { main?: string; additional?: Record<string, string> }
  }>
}

function slugify(text: string) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, "-").replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "")
}

// ── GET: poll job progress ──
export async function GET(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const url = new URL(req.url)
  const id = url.searchParams.get("jobId")
  if (!id) return NextResponse.json({ error: "Missing jobId" }, { status: 400 })

  const job = jobs.get(id)
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    total: job.total,
    processed: job.processed,
    stats: job.stats,
    error: job.error,
  })
}

// ── POST: start import ──
export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  let body: { url?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const url = body.url?.trim()
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 })

  const jid = jobId()
  jobs.set(jid, { status: "running", progress: 0, total: 0, processed: 0, stats: null, error: null })

  // Run in background — don't await
  runImport(jid, url).catch(err => {
    const j = jobs.get(jid)
    if (j) { j.status = "error"; j.error = err instanceof Error ? err.message : String(err) }
    console.error("[import] Background job failed:", err)
  })

  return NextResponse.json({ jobId: jid })
}

async function runImport(jid: string, sourceUrl: string) {
  const job = jobs.get(jid)!
  const updateProgress = (processed: number, total: number) => {
    job.processed = processed
    job.total = total
    job.progress = total > 0 ? Math.round((processed / total) * 100) : 0
  }

  // ── Download step (10%) ──
  updateProgress(0, 1)
  console.log(`[import:${jid}] Fetching:`, sourceUrl)
  const fetchRes = await fetch(sourceUrl, {
    headers: { "User-Agent": "OZO-Import/1.0" },
    signal: AbortSignal.timeout(120_000),
  })
  if (!fetchRes.ok) {
    job.status = "error"; job.error = `HTTP ${fetchRes.status} from source`
    return
  }

  const raw = await fetchRes.text()
  console.log(`[import:${jid}] Downloaded ${raw.length} bytes`)

  let data: SandiJson
  try { data = JSON.parse(raw) } catch {
    job.status = "error"; job.error = "Invalid JSON from source"
    return
  }

  const stats = {
    categories: { created: 0, skipped: 0 },
    brands: { created: 0, skipped: 0 },
    products: { created: 0, updated: 0, skipped: 0 },
  }

  // ── 1. Brands (5%) ──
  const brandEntries = data.brands ? Object.entries(data.brands) : []
  const brandIdByUuid = new Map<string, number>()
  for (let i = 0; i < brandEntries.length; i++) {
    const [uuid, b] = brandEntries[i]
    updateProgress(i + 1, brandEntries.length + 1)
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
    } catch (e) { console.error(`[import:${jid}] Brand error:`, b.name, e) }
  }

  // ── 2. Categories (10%) ──
  const catEntries = data.categories ? Object.entries(data.categories) : []
  const categoryIdByUuid = new Map<string, number>()
  if (catEntries.length) {
    const catData = catEntries.map(([uuid, c]) => ({ uuid, ...c, slug: slugify(c.name.uk) }))
    const byUuid = new Map(catData.map(c => [c.uuid, c]))
    let catProcessed = 0

    async function ensureCategory(uuid: string): Promise<number> {
      if (categoryIdByUuid.has(uuid)) return categoryIdByUuid.get(uuid)!
      const c = byUuid.get(uuid)
      if (!c) throw new Error(`Category not found: ${uuid}`)
      let parentId: number | null = null
      if (c.parent_ref && byUuid.has(c.parent_ref)) parentId = await ensureCategory(c.parent_ref)
      const existing = await prisma.category.findUnique({ where: { slug: c.slug }, select: { id: true } })
      if (existing) {
        categoryIdByUuid.set(uuid, existing.id)
        stats.categories.skipped++
        return existing.id
      }
      const created = await prisma.category.create({ data: { name: c.name.uk, slug: c.slug, parentId, imageUrl: c.image } })
      categoryIdByUuid.set(uuid, created.id)
      stats.categories.created++
      return created.id
    }

    for (const [uuid] of catEntries) {
      catProcessed++
      updateProgress(catProcessed, catEntries.length + 1)
      try { await ensureCategory(uuid) } catch (e) { console.error(`[import:${jid}] Category error:`, uuid, e) }
    }
  }

  // ── 3. Products (75%) ──
  const productEntries = data.products ? Object.entries(data.products) : []
  const BATCH_SIZE = 50
  let productIdx = 0

  updateProgress(0, productEntries.length || 1)
  for (let i = 0; i < productEntries.length; i += BATCH_SIZE) {
    const batch = productEntries.slice(i, i + BATCH_SIZE)
    for (const [uuid, p] of batch) {
      productIdx++
      if (productIdx % 10 === 0) updateProgress(productIdx, productEntries.length)

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
        const categoryId = main.category ? (categoryIdByUuid.get(main.category) ?? null) : null
        const slug = slugify(`${name}-${vendorCode || sku}`).slice(0, 190) || `product-${sku}`

        let fullDescription = description
        if (p.attributes) {
          const attrLines: string[] = []
          for (const [, av] of Object.entries(p.attributes)) {
            const val = av.uk || av.ru
            if (val && val.length < 150) attrLines.push(val)
          }
          if (attrLines.length) fullDescription += "\n\n" + attrLines.join("\n")
        }

        const existing = await prisma.product.findUnique({ where: { sku }, select: { id: true } })
        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: { price, oldPrice, stock: stock > 0 ? stock : undefined, brandId: brandId ?? undefined },
          })
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
              name, sku, slug,
              description: description.slice(0, 400),
              fullDescription: fullDescription.slice(0, 5000),
              price, oldPrice, stock, brandId,
              isPublished: true,
            },
          })
          if (categoryId) {
            await prisma.productCategory.create({ data: { productId: product.id, categoryId, isMain: true } })
          }
          await prisma.productVariant.create({ data: { productId: product.id, sku, volume: "", packageType: "", priceRetail: price, stock } })
          const images: { url: string; alt: string; sort: number; isMain: boolean }[] = []
          if (p.images?.main) images.push({ url: p.images.main, alt: name, sort: 0, isMain: true })
          if (p.images?.additional) {
            let s = 1
            for (const [, imgUrl] of Object.entries(p.images.additional)) { images.push({ url: imgUrl, alt: name, sort: s, isMain: false }); s++ }
          }
          if (images.length) {
            await prisma.productImage.createMany({ data: images.map(img => ({ ...img, productId: product.id })) })
          }
          stats.products.created++
        }
      } catch (e) {
        console.error(`[import:${jid}] Product error:`, p.main?.sku, e)
      }
    }
  }

  // ── Done ──
  job.status = "done"
  job.progress = 100
  job.processed = productEntries.length
  job.total = productEntries.length
  job.stats = stats
  console.log(`[import:${jid}] DONE`, stats)
}
