import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function GET() {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const [addons, calcProducts, calcBundles, catalogProducts] = await Promise.all([
    prisma.calculatorAddon.findMany(),
    prisma.calculatorProduct.findMany(),
    prisma.calculatorBundle.findMany(),
    prisma.product.findMany({
      where: { isPublished: true },
      select: { id: true, name: true, price: true, volume: true, productType: true },
    }),
  ])

  const addonMap: Record<string, { name: string; val: number }> = {}
  for (const a of addons) addonMap[a.id] = { name: a.name, val: a.val }

  const calcProductMap = new Map(calcProducts.map((p) => [p.id, p]))
  const calcBundleMap = new Map(calcBundles.map((b) => [b.id, b]))

  const products = catalogProducts
    .filter((p) => p.productType === "SINGLE")
    .map((p) => {
      const calc = calcProductMap.get(p.id)
      const defaultVol = parseInt(p.volume || "0", 10) || 500
      return {
        id: p.id,
        name: p.name,
        buy: calc?.buy ?? Math.round(p.price * 0.35),
        vol: calc?.vol ?? defaultVol,
        dose: calc?.dose ?? 50,
        sale: calc?.sale ?? p.price,
        adds: (calc?.adds as string[]) ?? [],
      }
    })

  const bundles = catalogProducts
    .filter((p) => p.productType === "BUNDLE")
    .map((p) => {
      const calc = calcBundleMap.get(p.id)
      return {
        id: p.id,
        name: p.name,
        sale: calc?.sale ?? p.price,
        items: (calc?.items as number[]) ?? [],
        adds: (calc?.adds as string[]) ?? [],
      }
    })

  return NextResponse.json({ addons: addonMap, products, bundles })
}

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const body = await req.json()

  await prisma.$transaction(async (tx) => {
    await tx.calculatorAddon.deleteMany()
    if (body.addons) {
      const entries = Object.entries(body.addons) as [string, { name: string; val: number }][]
      if (entries.length) {
        await tx.calculatorAddon.createMany({
          data: entries.map(([id, a]) => ({ id, name: a.name, val: a.val })),
        })
      }
    }

    await tx.calculatorProduct.deleteMany()
    if (body.products?.length) {
      await tx.calculatorProduct.createMany({
        data: body.products.map((p: { id: number; name: string; buy: number; vol: number; dose: number; sale: number; adds: string[] }) => ({
          id: p.id,
          name: p.name,
          buy: p.buy,
          vol: p.vol,
          dose: p.dose,
          sale: p.sale,
          adds: p.adds ?? [],
        })),
      })
    }

    await tx.calculatorBundle.deleteMany()
    if (body.bundles?.length) {
      await tx.calculatorBundle.createMany({
        data: body.bundles.map((b: { id: number; name: string; sale: number; items: number[]; adds: string[] }) => ({
          id: b.id,
          name: b.name,
          sale: b.sale,
          items: b.items ?? [],
          adds: b.adds ?? [],
        })),
      })
    }
  })

  return NextResponse.json({ ok: true })
}
