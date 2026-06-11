import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ProductCard from "@/components/product-card"
import type { Metadata } from "next"
import { getTopCategories, getPostBySlug, getProductsByIds } from "@/lib/storefront-db"
import { normalizeImageUrl } from "@/lib/image-path"
import Breadcrumbs from "@/components/breadcrumbs"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const categories = await getTopCategories()
  const headerCategories = categories.map((c) => ({ slug: c.slug, name: c.name }))

  const productIds = (post.productIds as number[]) ?? []
  const recommendedProducts = productIds.length > 0 ? await getProductsByIds(productIds) : []

  return (
    <>
      <Header categories={headerCategories} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: "На головну", href: "/" },
          { label: "Блог", href: "/blog" },
          { label: post.title, href: `/blog/${slug}` },
        ]} />
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Назад до блогу
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
              {post.title}
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {new Date(post.createdAt).toLocaleDateString("uk-UA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </header>

          {post.image && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-secondary mb-8">
              <Image
                src={normalizeImageUrl(post.image)}
                alt={post.title}
                fill
                unoptimized
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          )}

          <div
            className="blog-content text-sm text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: post.content
                .replace(/\u00a0/g, " ")
                .replace(/&nbsp;/g, " "),
            }}
          />

          {post.ctaText && post.ctaUrl && (
            <div className="mt-10 text-center">
              <a
                href={post.ctaUrl}
                className="inline-flex items-center justify-center bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white text-sm font-medium px-8 py-3 rounded-xl hover:from-[#0c5db8] hover:to-[#00c5e3] transition-colors"
              >
                {post.ctaText}
              </a>
            </div>
          )}
        </article>

        {recommendedProducts.length > 0 && (
          <section className="mt-14 border-t pt-8">
            <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-5">
              Рекомендовані товари
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
