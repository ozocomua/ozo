import Link from "next/link"
import { prisma } from "@/lib/prisma"
import Header from "@/components/header"
import Breadcrumbs from "@/components/breadcrumbs"
import Footer from "@/components/footer"
import { getTopCategories } from "@/lib/storefront-db"

export const metadata = {
  title: "Каталог товарів | OZO",
  description: "Повний каталог товарів для птахівництва. Інкубатори, годівниці, напувалки, клітки та багато іншого.",
}

export default async function CatalogPage() {
  const categories = await getTopCategories()
  const headerCategories = categories.map((c) => ({ slug: c.slug, name: c.name }))

  // Get all top-level categories with their direct children
  const topCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      children: {
        orderBy: { name: "asc" },
        select: { id: true, slug: true, name: true, imageUrl: true },
      },
    },
  })

  // Count products per category
  const productCounts = await prisma.productCategory.groupBy({
    by: ["categoryId"],
    _count: { productId: true },
  })
  const countMap = new Map(productCounts.map((c) => [c.categoryId, c._count.productId]))

  return (
    <>
      <Header categories={headerCategories} />
      <div className="min-h-screen bg-[#F9F9F7] pb-20">
        <div className="max-w-6xl mx-auto px-4 pt-10">
          <Breadcrumbs items={[{ label: "На головну", href: "/" }, { label: "Каталог", href: "/catalog" }]} />

          <h1 className="text-2xl md:text-4xl font-serif italic mt-6 mb-2">Каталог товарів</h1>
          <p className="text-sm text-muted-foreground mb-10">
            Оберіть категорію для перегляду товарів
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog/${cat.slug}`}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-black/5 hover:shadow-md hover:border-[#00B5D1]/30 transition-all"
              >
                {/* Category image */}
                <div className="w-full h-40 rounded-xl bg-muted/40 overflow-hidden mb-4">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-10 font-serif italic">
                      {cat.name[0]}
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-lg group-hover:text-[#0B53A4] transition-colors">
                  {cat.name}
                </h3>

                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{countMap.get(cat.id) ?? 0} товарів</span>
                  {cat.children.length > 0 && (
                    <>
                      <span className="opacity-25">|</span>
                      <span>{cat.children.length} підкатегорій</span>
                    </>
                  )}
                </div>

                {/* Subcategory pills */}
                {cat.children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {cat.children.slice(0, 4).map((child) => (
                      <span
                        key={child.id}
                        className="text-[10px] font-bold uppercase tracking-tight bg-muted/50 px-2.5 py-1 rounded-full text-muted-foreground group-hover:bg-[#00B5D1]/10 group-hover:text-[#00B5D1] transition-colors"
                      >
                        {child.name}
                      </span>
                    ))}
                    {cat.children.length > 4 && (
                      <span className="text-[10px] font-bold text-muted-foreground/40 py-1">
                        +{cat.children.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {topCategories.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg opacity-40 font-serif italic">
                Категорії ще не додані. Виконайте імпорт товарів.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
