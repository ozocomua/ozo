import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Truck } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ProductCard from "@/components/product-card"
import ProductGallery from "@/components/product-gallery"
import AddToCartButton from "@/components/add-to-cart-button"
import ProductVariantPicker from "@/components/product-variant-picker"
import BundleOffer from "@/components/bundle-offer"
import ProductDescription from "@/components/product-description"
import { ReviewsSection } from "@/components/reviews-section"
import { StarRating } from "@/components/star-rating"
import { WriteReviewInline } from "@/components/write-review-inline"
import { getTopCategories, getProductBySlug, getProductsByCategoryId, getCategoryBySlug, getProductsByIds } from "@/lib/storefront-db"
import { cleanMetaTitle, cleanMetaDescription, stripHtml, truncate } from "@/lib/html-utils"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface Props {
  params: Promise<{ productId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params
  const product = await getProductBySlug(productId)
  if (!product) return {}
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""

  const metaTitle = cleanMetaTitle(product.metaTitle, product.name)
  const metaDescription = cleanMetaDescription(product.metaDescription, product.description, product.name)

  if (process.env.NODE_ENV !== "production") {
    console.log("[generateMetadata] metaTitle:", metaTitle)
    console.log("[generateMetadata] metaDescription:", metaDescription)
  }

  return {
    title: metaTitle || product.name,
    description: metaDescription || undefined,
    alternates: {
      canonical: `${SITE_URL}/product/${productId}`,
    },
    openGraph: {
      title: metaTitle || product.name,
      description: metaDescription || undefined,
      url: `${SITE_URL}/product/${productId}`,
      siteName: "OZO",
      images: product.image ? [{ url: product.image, width: 1200, height: 630 }] : [],
      locale: "uk_UA",
      type: "product",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle || product.name,
      description: metaDescription || undefined,
      images: product.image ? [product.image] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params
  const product = await getProductBySlug(productId)
  if (!product) notFound()

  const topCategories = await getTopCategories()
  const headerCategories = topCategories.map((c) => ({ slug: c.slug, name: c.name }))

  const productCategory = product.categorySlug ? await getCategoryBySlug(product.categorySlug) : null

  let related: typeof product[] = []
  if (productCategory) {
    const catProducts = await getProductsByCategoryId(productCategory.id)
    related = catProducts.filter((p) => p.id !== product.id).slice(0, 4)
  }

  const followProducts = await getProductsByIds(product.relatedIds)

  let bundleProduct: typeof product | null = null
  if (product.bundleProductId) {
    const byId = await getProductsByIds([product.bundleProductId])
    bundleProduct = byId[0] ?? null
  }

  const bundlePartner = followProducts[0]
  const showBundle = bundleProduct !== null && bundlePartner !== undefined

  const cleanDescription = truncate(stripHtml(product.description || product.fullDescription), 300)

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: cleanDescription || undefined,
    sku: product.sku,
    image: product.images[0] || undefined,
    ...(product.brandName ? { brand: { "@type": "Brand", name: product.brandName } } : {}),
    ...(product.reviewCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.avgRating,
        reviewCount: product.reviewCount,
      },
    } : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "UAH",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "UA",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
        description:
          "Ви можете повернути товар протягом 14 днів з моменту отримання. Повернення здійснюється через службу доставки Нова Пошта. Вартість зворотної доставки — за рахунок продавця. Товар має бути в оригінальній упаковці та без слідів використання.",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "UAH",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "UA",
          name: "Україна",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "d",
            unitText: "дні",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "d",
            unitText: "дні",
          },
        },
        description:
          "Доставка по всій Україні Новою Поштою. Замовлення обробляються протягом 1–2 робочих днів. Термін транзиту — 1–3 дні залежно від регіону.",
      },
    },
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""

  const breadcrumbPositions: { "@type": string; position: number; name: string; item: string }[] = [
    { "@type": "ListItem", position: 1, name: "Головна", item: SITE_URL + "/" },
  ]
  if (productCategory) {
    breadcrumbPositions.push({
      "@type": "ListItem",
      position: 2,
      name: productCategory.name,
      item: `${SITE_URL}/catalog/${product.categorySlug}`,
    })
  }
  breadcrumbPositions.push({
    "@type": "ListItem",
    position: breadcrumbPositions.length + 1,
    name: product.name,
    item: `${SITE_URL}/product/${product.slug}`,
  })

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbPositions,
  }

  return (
    <>
      <Header categories={headerCategories} />
      <main className="max-w-5xl mx-auto px-4 pb-16">
        <div className="py-4 space-y-1.5">
          <Link
            href={productCategory ? `/catalog/${product.categorySlug}` : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Назад
          </Link>

          <nav aria-label="Хлібні крихти" className="text-xs sm:text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">
              Головна
            </Link>
            {productCategory && (
              <>
                <span className="mx-1.5">/</span>
                <Link href={`/catalog/${product.categorySlug}`} className="hover:text-foreground transition-colors">
                  {productCategory.name}
                </Link>
              </>
            )}
            <span className="mx-1.5">/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>

        {/* BLOK 1: Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-full">

          {/* LEFT: Photos only */}
          <div className="w-full min-w-0">
            <ProductGallery
              images={product.images}
              name={product.name}
              badge={product.stock > 0 ? (product.isNew ? "Новинка" : product.badge) : null}
              isPopular={product.stock > 0 ? product.isPopular : false}
              seoAlt={product.seoAlt}
            />
          </div>

          {/* RIGHT: Commercial info */}
          <div className="flex flex-col justify-start space-y-4 w-full min-w-0 max-w-full">

            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Артикул: {product.sku}
              </p>
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.avgRating} size={12} />
                  <span className="text-xs sm:text-sm text-muted-foreground">({product.reviewCount})</span>
                </div>
              )}
            </div>
            {product.brandName && (
              <p className="text-sm text-muted-foreground">
                {product.brandName}
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              {product.volume ? (
                <span className="text-sm text-muted-foreground">
                  {product.volume}
                </span>
              ) : null}
              <span className={`text-sm font-medium flex items-center gap-1.5 ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${product.stock > 0 ? "bg-green-600" : "bg-red-500"}`} />
                {product.stock > 0 ? "В наявності" : "Немає в наявності"}
              </span>
              <WriteReviewInline productId={product.id} />
            </div>

            <ProductVariantPicker product={product} variants={product.variants.filter((v: any) => (v.size != null && v.size !== "") || v.volume)} />

            {product.relatedVersions.length > 0 && (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  Версії товару
                </p>
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-block w-full text-center px-3.5 py-1.5 text-sm rounded-full truncate bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white border border-transparent">
                    {product.relatedLabels?.[product.id] || product.name}
                  </span>
                  {product.relatedVersions.map((v) => (
                    <Link
                      key={v.slug}
                      href={`/product/${v.slug}`}
                      className="inline-block w-full text-center px-3.5 py-1.5 text-sm rounded-full truncate border transition-colors bg-background text-foreground border-border hover:border-foreground"
                    >
                      {product.relatedLabels?.[v.id] || v.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-[11px] sm:text-xs text-muted-foreground uppercase tracking-[0.2em]">
              Безкоштовна консультація при замовленні
            </p>

            <div className="bg-secondary rounded-xl p-4 flex gap-3">
              <Truck size={20} className="shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Доставка Новою Поштою та Укрпоштою
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  По всій Україні. Оплата при отриманні — платите тільки після
                  того, як отримали замовлення.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* BLOK 2: Description — full width */}
        <ProductDescription
          html={(product.fullDescription || product.description || "")}
        />

        <ReviewsSection
          reviews={product.reviews}
          avgRating={product.avgRating}
          reviewCount={product.reviewCount}
          productId={product.id}
          productName={product.name}
        />

        {showBundle && bundleProduct && bundlePartner && (
          <BundleOffer current={product} partner={bundlePartner} bundleProduct={bundleProduct} />
        )}

        {(() => {
          const visibleFollow = showBundle ? followProducts.length - 1 : followProducts.length
          if (visibleFollow <= 0) return null
          return (
            <div className="mt-14">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                З цим товаром купують
              </h2>
              <p className="text-xs text-muted-foreground mb-5">
                Клієнти часто додають до замовлення разом із цим товаром
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {followProducts.slice(showBundle ? 1 : 0).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )
        })()}

        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-5">
              Вам також може сподобатись
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  )
}
