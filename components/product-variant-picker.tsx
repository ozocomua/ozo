"use client"

import { useState } from "react"
import AddToCartButton from "@/components/add-to-cart-button"

interface Variant {
  id: number
  size: string | null
  volume: string
  priceRetail: number
  stock: number
}

export default function ProductVariantPicker({
  product,
  variants,
}: {
  product: any
  variants: Variant[]
}) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = variants[selectedIdx] || null

  const productWithVariant = selected
    ? {
        ...product,
        id: selected.id,
        price: selected.priceRetail,
        variantSize: selected.size || selected.volume,
      }
    : product

  return (
    <div className="space-y-4">
      {variants.length > 0 && (
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-3">
            Розмір
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setSelectedIdx(idx)}
                className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                  idx === selectedIdx
                    ? "bg-[#0B53A4] text-white border-[#0B53A4]"
                    : "bg-white text-foreground border-border hover:border-[#0B53A4] hover:text-[#0B53A4]"
                }`}
              >
                {v.size || v.volume}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-foreground">
            {selected ? selected.priceRetail : product.price} ₴
          </span>
          {product.oldPrice && product.oldPrice > product.price && !selected && (
            <span className="text-lg text-muted-foreground line-through">
              {product.oldPrice} ₴
            </span>
          )}
        </div>
      </div>

      <AddToCartButton product={productWithVariant} />
    </div>
  )
}
