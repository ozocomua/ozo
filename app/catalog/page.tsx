import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import CatalogProducts from "@/components/catalog-products"
import { getTopCategories, getAllProducts, getAllBrands, getBrandBySlug, getProductsByBrandSlug, countAllProducts, countProductsByBrandSlug } from "@/lib/storefront-db"
import type { Metadata } from "next"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Каталог — OZO",
  description: "Каталог обладнання для птахівництва",
}

export default async function CatalogIndexPage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand } = await searchParams
  const topCategories = await getTopCategories()
  const allBrands = await getAllBrands()
  const headerCategories = topCategories.map((c) => ({ slug: c.slug, name: c.name }))

  let title = "Усі товари"
  let products
  let total = 0
  let fetchUrl = "/api/products"

  if (brand) {
    const brandData = await getBrandBySlug(brand)
    if (brandData) {
      title = brandData.name
      products = await getProductsByBrandSlug(brand, { limit: 24 })
      total = await countProductsByBrandSlug(brand)
      fetchUrl = `/api/products?brandSlug=${encodeURIComponent(brand)}`
    } else {
      products = []
    }
  } else {
    products = await getAllProducts({ limit: 24 })
    total = await countAllProducts()
  }

  return (
    <>
      <Header categories={headerCategories} />
      <main className="max-w-5xl mx-auto px-4 pb-16">
        <div className="py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Назад
          </Link>
        </div>

        <div className="mb-6">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-2">
            Каталог
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground text-balance">
            {title}
          </h1>
        </div>

        {allBrands.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3">
              Бренди
            </h2>
            <div className="flex flex-wrap gap-2">
              {allBrands.map((b) => (
                <Link
                  key={b.id}
                  href={`/catalog?brand=${b.slug}`}
                  className={`px-3 py-1.5 border rounded-full text-xs transition-colors ${
                    brand === b.slug
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

        <CatalogProducts initialProducts={products} total={total} fetchUrl={fetchUrl} />

        <div className="mt-12">
          <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-4">
            Категорії
          </h2>
          <div className="flex flex-wrap gap-2">
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog/${cat.slug}`}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
