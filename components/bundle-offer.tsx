"use client"

import Image from "next/image"
import Link from "next/link"
import { Plus, Equal } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { normalizeImageUrl } from "@/lib/image-path"
import type { StorefrontProduct } from "@/lib/storefront-db"

interface BundleOfferProps {
  current: StorefrontProduct
  partner: StorefrontProduct
  bundleProduct: StorefrontProduct
}

export default function BundleOffer({ current, partner, bundleProduct }: BundleOfferProps) {
  const { addToCart } = useCart()

  const normalSum = current.price + partner.price
  const bundlePrice = bundleProduct.price
  const economy = normalSum - bundlePrice

  const handleBuyBundle = () => {
    const v = bundleProduct.variants?.[0]
    addToCart({
      id: v ? v.id : bundleProduct.id,
      name: v ? `${bundleProduct.name} (${v.volume})` : bundleProduct.name,
      price: v ? v.priceRetail : bundleProduct.price,
      image: bundleProduct.image,
      slug: bundleProduct.slug,
      productId: bundleProduct.id,
      maxStock: bundleProduct.stock,
    })
  }

  return (
    <div className="mt-14">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Разом дешевше
      </h2>
      <p className="text-xs text-muted-foreground mb-8">
        Купуйте комплектом та заощаджуйте
      </p>

      <div className="hidden md:flex md:flex-row md:gap-3 md:justify-center">
        <Link
          href={`/product/${current.slug}`}
          className="max-w-[240px] w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <Image src={normalizeImageUrl(current.image)} alt={current.name} fill unoptimized className="object-cover" sizes="240px" />
          </div>
          <div className="p-3 flex flex-col flex-1">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2">{current.name}</h3>
            <span className="text-sm font-bold text-foreground mt-1">{current.price} ₴</span>
          </div>
        </Link>

        <Plus size={20} className="text-muted-foreground/40 shrink-0 self-center" />

        <Link
          href={`/product/${partner.slug}`}
          className="max-w-[240px] w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <Image src={normalizeImageUrl(partner.image)} alt={partner.name} fill unoptimized className="object-cover" sizes="240px" />
          </div>
          <div className="p-3 flex flex-col flex-1">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2">{partner.name}</h3>
            <span className="text-sm font-bold text-foreground mt-1">{partner.price} ₴</span>
          </div>
        </Link>

        <Equal size={20} className="text-muted-foreground/40 shrink-0 self-center" />

        <Link
          href={`/product/${bundleProduct.slug}`}
          className="max-w-[240px] w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <Image src={normalizeImageUrl(bundleProduct.image)} alt={bundleProduct.name} fill unoptimized className="object-cover" sizes="240px" />
          </div>
          <div className="p-3 flex flex-col flex-1">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2">{bundleProduct.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground line-through">{normalSum} ₴</span>
              <span className="text-sm font-bold text-foreground">{bundlePrice} ₴</span>
            </div>
            {economy > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                Вигода {economy} ₴
              </span>
            )}
            <div className="mt-auto pt-3">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuyBundle() }}
                className="w-full bg-foreground text-background text-xs font-medium py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Додати до кошика
              </button>
            </div>
          </div>
        </Link>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        <Link
          href={`/product/${current.slug}`}
          className="flex gap-4 items-center bg-card border border-border rounded-2xl p-3"
        >
          <div className="relative w-20 h-20 bg-secondary rounded-2xl overflow-hidden flex-shrink-0 border border-black/[0.03]">
            <Image src={normalizeImageUrl(current.image)} alt={current.name} fill unoptimized className="object-cover" sizes="80px" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base truncate">{current.name}</h4>
            <p className="text-muted-foreground font-semibold text-sm">{current.price} ₴</p>
          </div>
        </Link>

        <Plus size={18} className="text-muted-foreground/30 self-center rotate-90" />

        <Link
          href={`/product/${partner.slug}`}
          className="flex gap-4 items-center bg-card border border-border rounded-2xl p-3"
        >
          <div className="relative w-20 h-20 bg-secondary rounded-2xl overflow-hidden flex-shrink-0 border border-black/[0.03]">
            <Image src={normalizeImageUrl(partner.image)} alt={partner.name} fill unoptimized className="object-cover" sizes="80px" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base truncate">{partner.name}</h4>
            <p className="text-muted-foreground font-semibold text-sm">{partner.price} ₴</p>
          </div>
        </Link>

        <Equal size={18} className="text-muted-foreground/30 self-center rotate-90" />

        <div className="flex gap-4 items-center bg-card border border-border rounded-2xl p-3">
          <div className="relative w-20 h-20 bg-secondary rounded-2xl overflow-hidden flex-shrink-0 border border-black/[0.03]">
            <Image src={normalizeImageUrl(bundleProduct.image)} alt={bundleProduct.name} fill unoptimized className="object-cover" sizes="80px" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <Link href={`/product/${bundleProduct.slug}`} className="block">
              <h4 className="font-bold text-base truncate hover:opacity-70 transition-opacity">{bundleProduct.name}</h4>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground line-through">{normalSum} ₴</span>
              <span className="text-sm font-bold text-foreground">{bundlePrice} ₴</span>
            </div>
            {economy > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground">Вигода {economy} ₴</span>
            )}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuyBundle() }}
              className="mt-1 bg-foreground text-background text-xs font-medium py-1.5 px-3 rounded-lg hover:opacity-90 active:scale-95 transition-all self-start"
            >
              Додати до кошика
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
