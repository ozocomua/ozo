import { Suspense } from "react"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import CatalogProducts from "@/components/catalog-products"
import Breadcrumbs from "@/components/breadcrumbs"
import {
  getTopCategories,
  getAllBrands,
  getBrandBySlug,
  getAllProducts,
  getProductsByBrandSlug,
  countAllProducts,
  countProductsByBrandSlug,
} from "@/lib/storefront-db"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ brand?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""
  return {
    title: "Каталог товарів | OZO",
    description: "Весь асортимент товарів ручної роботи, зроблених в Україні з турботою. Інфрачервоні нагрівальні килимки та інші вироби. Вигідні ціни та швидка доставка по Україні.",
    alternates: { canonical: `${SITE_URL}/catalog` },
  }
}

export default async function CatalogIndexPage({ searchParams }: Props) {
  const sp = await searchParams
  const brandSlug = sp.brand?.trim() || ""

  const topCategories = await getTopCategories()
  const allBrands = await getAllBrands()
  const headerCategories = topCategories.map((c) => ({ slug: c.slug, name: c.name }))

  const brand = brandSlug ? await getBrandBySlug(brandSlug) : null

  const products = brand
    ? await getProductsByBrandSlug(brandSlug, { limit: 24 })
    : await getAllProducts({ limit: 24 })
  const total = brand
    ? await countProductsByBrandSlug(brandSlug)
    : await countAllProducts()

  const fetchUrl = brand ? `/api/products?brandSlug=${brandSlug}` : "/api/products"

  return (
    <>
      <Header categories={headerCategories} />
      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-10">
        <div className="pt-4 space-y-1.5">
          <Breadcrumbs
            items={[
              { label: "Головна", href: "/" },
              { label: "Каталог", href: "/catalog" },
            ]}
          />
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground text-balance">
            {brand ? brand.name : "Каталог товарів"}
          </h1>
        </div>

        {allBrands.length > 0 && (
          <div>
            <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3">
              Бренди
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/catalog"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  !brand
                    ? "bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white border-transparent"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                Всі
              </Link>
              {allBrands.map((b) => (
                <Link
                  key={b.id}
                  href={`/catalog?brand=${b.slug}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    brand?.slug === b.slug
                      ? "bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white border-transparent"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <Suspense>
            <CatalogProducts
              initialProducts={products}
              total={total}
              fetchUrl={fetchUrl}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
