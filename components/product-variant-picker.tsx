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
  width: string | null
  priceRetail: number
  stock: number
}

/** Extract "50 см" and "20 см" from strings like "50×20 см", "50x40", "50 х 60" */
function parseSize(raw: string): { width: string | null; length: string } {
  const m = raw.match(/^(\d+)\s*[×xXх]\s*(\d+)/i)
  if (m) return { width: `${m[1]} см`, length: `${m[2]} см` }
  return { width: null, length: raw }
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
      const { width, length } = parseSize(raw)
      return { ...v, size: raw, width, length, priceRetail: v.priceRetail, stock: v.stock }
    }),
    [variants],
  )

  const selected = parsed[selectedIdx] || null
  const commonWidth = parsed.length > 0 ? parsed[0].width : null
  const allSameWidth = parsed.length > 0 && parsed.every((v) => v.width === commonWidth)

  const productWithVariant = selected
    ? {
        ...product,
        id: selected.id,
        price: selected.priceRetail,
        variantSize: selected.size,
      }
    : product

  if (!parsed.length) {
    return (
      <div className="space-y-4">
        <div>
          <span className="text-3xl font-bold text-foreground">{product.price} ₴</span>
        </div>
        <AddToCartButton product={product} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── ROW 1: Static width badge ── */}
      {allSameWidth && commonWidth && (
        <p className="text-[11px] font-medium text-muted-foreground tracking-wide">
          Ширина: {commonWidth}
        </p>
      )}

      {/* ── ROW 2: Length grid ── */}
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">
          Довжина
        </p>

        <div className="grid grid-cols-3 gap-2">
          {parsed.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => setSelectedIdx(idx)}
              className={`
                flex flex-col items-center justify-center
                px-3 py-2.5
                rounded-xl border-2 text-center
                transition-all duration-150
                ${idx === selectedIdx
                  ? "border-[#00B5D1] bg-[#00B5D1] text-white shadow-sm"
                  : "border-border bg-white text-foreground hover:border-[#00B5D1]/40"
                }
              `}
            >
              <span className="text-sm font-bold leading-tight">{v.length}</span>
              <span className={`text-[10px] leading-tight mt-0.5 ${
                idx === selectedIdx ? "text-white/70" : "text-muted-foreground"
              }`}>
                {v.priceRetail} ₴
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Price ── */}
      <div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-foreground">
            {selected.priceRetail} ₴
          </span>
        </div>
      </div>

      <AddToCartButton product={productWithVariant} />
    </div>
  )
}
