"use client"

import Link from "next/link"
import Image from "next/image"
import type { StorefrontProduct } from "@/lib/storefront-db"
import { useCart } from "@/lib/cart-context"
import { normalizeImageUrl } from "@/lib/image-path"
import { stripHtml, truncate } from "@/lib/html-utils"

interface ProductCardProps {
  product: StorefrontProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  const outOfStock = product.stock === 0
  const variants = product.variants || []
  const isVariantProduct = variants.length > 0

  // Display price: variants[0].priceRetail for variant products, product.price for simple
  const displayPrice = isVariantProduct
    ? (variants[0]?.priceRetail ?? 0)
    : (product.price ?? 0)
  const showFrom = isVariantProduct && variants.length > 1

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock || isVariantProduct) return

    // Simple product — add directly to cart
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
      productId: product.id,
      maxStock: product.stock,
    })
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col ${outOfStock ? "opacity-60 grayscale" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Image
          src={normalizeImageUrl(product.image)}
          alt={product.name}
          fill
          unoptimized
          className={`object-cover transition-transform duration-300 ${outOfStock ? "" : "group-hover:scale-105"}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        />
        {outOfStock ? (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] sm:text-[11px] font-medium tracking-wide px-2 py-0.5 rounded-full">
            Немає в наявності
          </span>
        ) : (
          <>
            {product.isNew && (
              <span className="absolute top-2 left-2 bg-foreground text-background text-[10px] sm:text-[11px] font-medium tracking-wide px-2 py-0.5 rounded-full">
                Новинка
              </span>
            )}
            {!product.isNew && product.isPopular && (
              <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] sm:text-[11px] font-medium tracking-wide px-2 py-0.5 rounded-full">
                Популярний
              </span>
            )}
            {!product.isNew && !product.isPopular && product.badge && (
              <span className="absolute top-2 left-2 bg-foreground text-background text-[10px] sm:text-[11px] font-medium tracking-wide px-2 py-0.5 rounded-full">
                {product.badge}
              </span>
            )}
          </>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 break-words min-h-[2.5rem]">{product.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {truncate(stripHtml(product.description), 100)}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex flex-col gap-0.5">
            {!outOfStock && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] font-medium text-emerald-600">В наявності</span>
              </div>
            )}
            <div className="flex items-baseline gap-1">
              {product.oldPrice && product.oldPrice > displayPrice && (
                <span className="text-xs text-muted-foreground line-through whitespace-nowrap">
                  {product.oldPrice} ₴
                </span>
              )}
              <span className="text-base font-bold text-foreground whitespace-nowrap">
                {showFrom ? "від " : ""}{displayPrice} ₴
              </span>
            </div>
          </div>
          {outOfStock ? (
            <span className="text-xs text-muted-foreground font-medium px-3 py-1.5">
              Немає в наявності
            </span>
          ) : isVariantProduct ? (
            <span className="text-xs sm:text-sm bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-semibold px-3 py-2 sm:px-4 sm:py-2.5 rounded-md min-h-[40px] sm:min-h-[44px] flex items-center justify-center">
              Купити
            </span>
          ) : (
            <button
              onClick={handleBuyClick}
              className="text-xs sm:text-sm bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-semibold px-3 py-2 sm:px-4 sm:py-2.5 rounded-md hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-95 transition-all min-h-[40px] sm:min-h-[44px]"
            >
              Купити
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
