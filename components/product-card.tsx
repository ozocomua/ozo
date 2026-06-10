"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
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
  const [showVariants, setShowVariants] = useState(false)

  const outOfStock = product.stock === 0
  const variantPrices = (product.variants || []).map((v: any) => v.priceRetail).filter((p: number) => p > 0)
  const displayPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.price
  const hasVariants = variantPrices.length > 1

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return

    // Variable product — open the variant picker sheet inline
    if (hasVariants) {
      setShowVariants(true)
      return
    }

    // Simple product — add cheapest variant directly
    const cheapest = product.variants?.reduce((best: any, cur: any) =>
      cur.priceRetail > 0 && cur.priceRetail < best.priceRetail ? cur : best,
      product.variants[0])
    const v = cheapest || product.variants?.[0]
    addToCart({
      id: v ? v.id : product.id,
      name: v ? `${product.name} (${v.size || v.volume})` : product.name,
      price: v ? v.priceRetail : product.price,
      image: product.image,
      slug: product.slug,
      productId: product.id,
      variantSize: v ? (v.size || v.volume) : undefined,
      maxStock: product.stock,
    })
  }

  return (
    <>
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
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2 flex-1">
            {truncate(stripHtml(product.description), 100)}
          </p>
          <div className="flex items-center justify-between mt-3 max-md:flex max-md:items-end max-md:justify-between max-md:mt-1">
            <div className="flex items-baseline gap-0.5 md:gap-2 max-md:flex max-md:flex-col max-md:items-center">
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-xs text-muted-foreground line-through whitespace-nowrap max-md:text-sm max-md:text-muted-foreground max-md:line-through max-md:translate-y-[1px] md:-translate-y-[1px]">
                  {product.oldPrice} ₴
                </span>
              )}
              <span className="text-base font-bold text-foreground whitespace-nowrap max-md:text-base max-md:font-bold max-md:text-foreground max-md:-translate-y-[2px]">
                {hasVariants ? "від " : ""}{displayPrice} ₴
              </span>
            </div>
            {outOfStock ? (
              <span className="text-xs text-muted-foreground font-medium px-3 py-1.5">
                Немає в наявності
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

      {/* Inline variant picker — opened from catalog card */}
      {showVariants && (
        <CatalogVariantSheet
          product={product}
          onClose={() => setShowVariants(false)}
          onAdded={() => setShowVariants(false)}
        />
      )}
    </>
  )
}

/* ── Lightweight inline variant sheet for catalog cards ── */
function CatalogVariantSheet({
  product,
  onClose,
  onAdded,
}: {
  product: StorefrontProduct
  onClose: () => void
  onAdded: () => void
}) {
  const { addToCart } = useCart()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [closing, setClosing] = useState(false)

  const variants = product.variants || []

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const close = () => {
    setClosing(true)
    setTimeout(onClose, 250)
  }

  const selectAndAdd = (idx: number) => {
    setSelectedIdx(idx)
    const v = variants[idx]
    if (v) {
      addToCart({
        id: v.id,
        name: `${product.name} (${v.size || v.volume})`,
        price: v.priceRetail,
        image: product.image,
        slug: product.slug,
        productId: product.id,
        variantSize: v.size || v.volume,
        maxStock: product.stock,
      })
    }
    close()
    onAdded()
  }

  if (!variants.length) return null

  return (
    <div className="fixed inset-0 z-[350] flex items-end md:items-center justify-center">
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-250 ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={close}
      />
      <div
        className={`
          relative w-full md:max-w-md md:mx-4
          bg-white rounded-t-3xl md:rounded-3xl shadow-2xl
          max-h-[85vh] md:max-h-[75vh] flex flex-col
          transition-transform duration-250 ease-out
          ${closing ? "translate-y-full md:translate-y-4 md:opacity-0" : "translate-y-0"}
        `}
      >
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-border shrink-0">
          <h3 className="text-base font-bold tracking-tight">Оберіть розмір</h3>
          <button onClick={close} className="p-1.5 hover:bg-muted rounded-full transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
          <div className="space-y-1 pb-2">
            {variants.map((v: any, idx: number) => {
              const label = v.size || v.volume || ""
              const isActive = idx === selectedIdx
              return (
                <button
                  key={v.id || idx}
                  type="button"
                  onClick={() => selectAndAdd(idx)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-150 ${
                    isActive ? "bg-[#00B5D1] text-white shadow-sm" : "bg-muted/40 text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className={`text-sm font-bold ${isActive ? "text-white/90" : "text-foreground"}`}>
                    {v.priceRetail} грн
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="pb-[env(safe-area-inset-bottom)] shrink-0" />
      </div>
    </div>
  )
}
