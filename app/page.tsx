import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import HomepageProducts from "@/components/homepage-products"
import DeliveryBanner from "@/components/delivery-banner"
import { StoreSchema } from "@/components/json-ld"
import { normalizeImageUrl } from "@/lib/image-path"
import { getTopCategories, getAllProducts, getAllBrands, countAllProducts, getPublishedPosts } from "@/lib/storefront-db"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const categories = await getTopCategories()
  const products = await getAllProducts({ limit: 12 })
  const totalProducts = await countAllProducts()
  const brands = await getAllBrands()
  const latestPosts = await getPublishedPosts({ limit: 3 })

  const headerCategories = categories.map((c) => ({ slug: c.slug, name: c.name }))

  return (
    <>
      <Header categories={headerCategories} />

      <main>
        <StoreSchema />
        <section className="hidden md:block bg-foreground text-background px-4 pt-1 pb-3 md:pt-3 md:pb-2">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-xl md:text-3xl font-bold leading-tight text-balance">
              Преміальна автохімія
              <br />
              <span className="text-background/70">для вашого авто</span>
            </h1>
          </div>
        </section>

        <DeliveryBanner />

        <section className="max-w-[1100px] mx-auto px-4 pt-8 pb-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Категорії
            </h2>
          </div>

          {/* МОБИЛЬНАЯ СЕТКА КАТЕГОРИЙ — СТРОГАЯ ГЕОМЕТРИЯ В 2 КОЛОНКИ */}
          <div className="md:hidden grid grid-cols-2 gap-3 mt-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/catalog/${cat.slug}`}
                className="relative group aspect-[4/5] w-full rounded-sm overflow-hidden bg-zinc-900"
              >
                <Image
                  src={normalizeImageUrl(cat.imageUrl)}
                  alt={cat.name}
                  fill
                  unoptimized
                  priority={i === 0}
                  className="object-cover grayscale-[40%] saturate-[65%] brightness-90 contrast-110 transition-all duration-500 group-hover:grayscale-0 group-hover:saturate-100 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-0.5">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden md:grid grid-cols-4 gap-4 mt-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/catalog/${cat.slug}`}
                className="relative group aspect-[3/4] w-full rounded-sm overflow-hidden bg-zinc-900"
              >
                <Image
                  src={normalizeImageUrl(cat.imageUrl)}
                  alt={cat.name}
                  fill
                  unoptimized
                  priority={i === 0}
                  className="object-cover grayscale-[40%] saturate-[65%] brightness-90 contrast-110 transition-all duration-500 group-hover:grayscale-0 group-hover:saturate-100 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-wider">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <HomepageProducts
          initialProducts={products}
          total={totalProducts}
        />

        {brands.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pt-8 pb-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Бренди
              </h2>
            </div>
            <div className="w-full relative mt-4">
              <div className="relative w-full overflow-hidden after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-12 after:bg-gradient-to-l after:from-background after:to-transparent">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 px-1 snap-x snap-mandatory">
                  {brands.map((b) => (
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
          </section>
        )}

        {latestPosts.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pt-8 pb-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Блог
              </h2>
              <Link href="/blog" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                Всі статті →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                    <Image
                      src={normalizeImageUrl(post.image || "/placeholder.jpg")}
                      alt={post.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      {new Date(post.createdAt).toLocaleDateString("uk-UA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:underline">
                      {post.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-5xl mx-auto px-4 py-6">
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-xs tracking-widest text-muted-foreground uppercase mb-3">
              Замовлення
            </p>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">
              Є запитання?
            </h2>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Зв&apos;яжіться з нами у Viber — відповідаємо швидко
            </p>
            <a
              href="viber://chat?number=%2B380689464743"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-foreground text-background text-sm font-medium px-6 py-3 rounded-xl hover:bg-foreground/90 transition-colors"
            >
              Написати у Viber
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
