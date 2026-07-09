import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Header from "@/components/header"
import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import { getTopCategories, getProductsByCategoryId } from "@/lib/storefront-db"
import ProductCard from "@/components/product-card"

export const metadata = {
  title: "Категорія | OZO",
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const allCategories = await getTopCategories()
  const headerCategories = allCategories.map((c) => ({ slug: c.slug, name: c.name }))

  // Find category
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { id: true, slug: true, name: true } },
      children: { select: { id: true, slug: true, name: true, imageUrl: true }, orderBy: { name: "asc" } },
    },
  })

  if (!category) notFound()

  // Collect all category IDs (self + children) for product count
  const childIds = category.children.map((c) => c.id)
  const allCategoryIds = [category.id, ...childIds]

  // Get products using the existing storefront function
  const products = await getProductsByCategoryId(allCategoryIds, { limit: 60 })

  const totalCount = products.length

  // Build breadcrumbs
  const breadcrumbs = [{ label: "На головну", href: "/" }, { label: "Каталог", href: "/catalog" }]
  if (category.parent) {
    breadcrumbs.push({ label: category.parent.name, href: `/catalog/${category.parent.slug}` })
  }
  breadcrumbs.push({ label: category.name, href: `/catalog/${slug}` })

  return (
    <>
      <Header categories={headerCategories} />
      <div className="min-h-screen bg-[#F9F9F7] pb-20">
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <Breadcrumbs items={breadcrumbs} />

          {/* Category header */}
          <div className="mt-6 mb-8">
            <h1 className="text-2xl md:text-4xl font-serif italic">{category.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount} товарів
              {category.children.length > 0 && ` · ${category.children.length} підкатегорій`}
            </p>
          </div>

          {/* Subcategories */}
          {category.children.length > 0 && (
            <div className="mb-10">
              <div className="flex flex-wrap gap-2">
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/catalog/${child.slug}`}
                    className="bg-white rounded-xl px-4 py-3 shadow-sm border border-black/5 hover:border-[#00B5D1]/40 hover:shadow-md transition-all text-sm font-medium"
                  >
                    {child.imageUrl && (
                      <img src={child.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover inline-block mr-2 align-middle" />
                    )}
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg opacity-40 font-serif italic">
                У цій категорії поки немає товарів
              </p>
              <Link
                href="/catalog"
                className="inline-block mt-4 text-sm text-[#00B5D1] font-bold hover:underline"
              >
                ← До каталогу
              </Link>
            </div>
          )}

          {/* Show more hint */}
          {totalCount > 60 && (
            <p className="text-center text-xs text-muted-foreground mt-8">
              Показано 60 із {totalCount} товарів. Використовуйте підкатегорії для уточнення.
            </p>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
