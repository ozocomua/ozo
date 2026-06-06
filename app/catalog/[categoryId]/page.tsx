import { notFound } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import CatalogProducts from "@/components/catalog-products"
import OtherCategoriesScroll from "@/components/other-categories-scroll"
import Breadcrumbs from "@/components/breadcrumbs"
import { getTopCategories, getCategoryBySlug, getProductsByCategoryId, getAllBrands, getSubcategories, countProductsByCategoryId } from "@/lib/storefront-db"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ categoryId: string }>
  searchParams: Promise<{ sort?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoryId } = await params
  const category = await getCategoryBySlug(categoryId)
  if (!category) return {}
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""
  return {
    title: category.metaTitle || category.name,
    description: category.metaDescription || category.description,
    alternates: {
      canonical: `${SITE_URL}/catalog/${categoryId}`,
    },
  }
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { categoryId } = await params
  const sp = await searchParams
  const sort = sp.sort || ""
  const category = await getCategoryBySlug(categoryId)
  if (!category) notFound()

  const topCategories = await getTopCategories()
  const allBrands = await getAllBrands()
  const subcategories = (await getSubcategories(category.id)) ?? []
  const allCategoryIds = [category.id, ...subcategories.map((s) => s.id)]
  const categoryProducts = await getProductsByCategoryId(allCategoryIds, { limit: 24 })
  const total = await countProductsByCategoryId(allCategoryIds)
  const otherCategories = topCategories.filter((c) => c.slug !== categoryId)
  const headerCategories = topCategories.map((c) => ({ slug: c.slug, name: c.name }))

  return (
    <>
      <Header categories={headerCategories} />
      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-10">
        <div className="pt-4 space-y-1.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Назад
          </Link>
          <Breadcrumbs
            items={[
              { label: "Головна", href: "/" },
              { label: category.name, href: `/catalog/${category.slug}` },
            ]}
          />
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground text-balance">
            {category.name}
          </h1>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>

        {subcategories.length > 0 && (
          <div>
            <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3">
              Підкатегорії
            </h2>
            <div className="flex flex-nowrap md:flex-wrap overflow-x-auto gap-2 pb-1">
              <Link
                href={`/catalog/${categoryId}`}
                className="shrink-0 px-4 py-2 bg-foreground text-background border border-foreground rounded-full text-sm font-medium transition-colors"
              >
                Всі товари
              </Link>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/catalog/${sub.slug}`}
                  className="shrink-0 px-4 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <Suspense>
            <CatalogProducts
              initialProducts={categoryProducts}
              total={total}
              sort={sort}
              fetchUrl={`/api/products?categoryId=${allCategoryIds.join(",")}`}
            />
          </Suspense>
        </div>

        <OtherCategoriesScroll categories={otherCategories} />

        {allBrands.length > 0 && (
          <div>
            <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3">
              Бренди
            </h2>
            <div className="relative w-full overflow-hidden after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-12 after:bg-gradient-to-l after:from-background after:to-transparent">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 px-1 snap-x snap-mandatory">
                {allBrands.map((b) => (
                  <Link
                    key={b.id}
                    href={`/catalog?brand=${b.slug}`}
                    className="snap-center shrink-0 px-5 py-2 text-sm border border-border rounded-full hover:bg-foreground hover:text-background transition-colors"
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
