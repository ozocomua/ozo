"use client"

import { useState, useMemo } from "react"
import AddToCartButton from "@/components/add-to-cart-button"

interface Variant {
  id: number
  size: string | null
  volume: string
  priceRetail: number
  stock: number
}

interface ParsedVariant {
  id: number
  size: string
  length: string
  lengthNum: number
  width: string | null
  priceRetail: number
  stock: number
}

function parseVariantSize(size: string): { width: string | null; length: string; lengthNum: number } {
  // Match patterns: "50x20", "50х20 см", "50 × 20 см", "50x20 см"
  const m = size.match(/^(\d+)\s*[×xXх]\s*(\d+)/i)
  if (m) {
    return { width: `${m[1]} см`, length: `${m[2]} см`, lengthNum: parseInt(m[2], 10) }
  }
  // fallback: just use as-is
  return { width: null, length: size, lengthNum: 0 }
}

export default function ProductVariantPicker({
  product,
  variants,
}: {
  product: any
  variants: Variant[]
}) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  const parsed = useMemo(() => 
    variants.map((v) => {
      const raw = v.size || v.volume || ""
      const { width, length, lengthNum } = parseVariantSize(raw)
      return { ...v, size: raw, width, length, lengthNum, priceRetail: v.priceRetail, stock: v.stock }
    }),
    [variants]
  )

  const selected = parsed[selectedIdx] || null
  const commonWidth = parsed.length > 0 ? parsed[0].width : null
  const allSameWidth = parsed.every((v) => v.width === commonWidth)

  const productWithVariant = selected
    ? {
        ...product,
        id: selected.id,
        price: selected.priceRetail,
        variantSize: selected.size,
      }
    : product

  return (
    <div className="space-y-4">
      {parsed.length > 0 && (
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">
            Довжина
          </p>

          {/* All-same-width badge */}
          {allSameWidth && commonWidth && (
            <p className="text-[11px] font-medium text-muted-foreground mb-2.5 tracking-wide">
              Ширина: {commonWidth}
            </p>
          )}

          {/* Horizontal scrollable row */}
          <div className="
            flex flex-row
            overflow-x-auto
            whitespace-nowrap
            scrollbar-none
            snap-x snap-mandatory
            gap-2 pb-2
            -mr-4 pr-4
          ">
            {parsed.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setSelectedIdx(idx)}
                className={`
                  snap-start shrink-0
                  flex flex-col items-center justify-center
                  min-w-[5rem]
                  px-5 py-3
                  rounded-xl border-2 text-center
                  transition-all duration-150
                  ${idx === selectedIdx
                    ? "border-[#00B5D1] bg-[#00B5D1] text-white shadow-md shadow-[#00B5D1]/20"
                    : "border-border bg-white text-foreground hover:border-[#00B5D1]/50 hover:text-[#00B5D1]"
                  }
                `}
              >
                <span className="text-sm font-bold leading-tight">{v.length}</span>
                <span className={`text-[11px] leading-tight mt-0.5 ${
                  idx === selectedIdx ? "text-white/80" : "text-muted-foreground"
                }`}>
                  {v.priceRetail} ₴
                </span>
              </button>
            ))}

            {/* Right-edge spacer to hint scrolling */}
            <div className="w-[1px] shrink-0" />
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-foreground">
            {selected ? selected.priceRetail : product.price} ₴
          </span>
        </div>
      </div>

      <AddToCartButton product={productWithVariant} />
    </div>
  )
}
