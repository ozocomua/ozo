"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronDown, X } from "lucide-react"
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
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const selected = variants[selectedIdx] || null
  const sizeLabel = selected
    ? (selected.size || selected.volume)
    : ""

  const productWithVariant = selected
    ? {
        ...product,
        id: selected.id,
        productId: product.id,
        price: selected.priceRetail,
        variantSize: selected.size || selected.volume,
      }
    : product

  /* ── close animation ── */
  const closeSheet = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 250)
  }, [])

  const selectAndClose = (idx: number) => {
    setSelectedIdx(idx)
    closeSheet()
  }

  /* ── lock body scroll when sheet is open ── */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!variants.length) {
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
      {/* ── Trigger pill ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-muted/60 rounded-xl border border-border hover:border-[#00B5D1]/50 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.2em] text-muted-foreground shrink-0">
            Розмір
          </span>
          <span className="text-sm font-semibold text-foreground truncate">
            {sizeLabel}
          </span>
        </div>
        <span className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground group-hover:text-[#00B5D1] transition-colors">
          Змінити
          <ChevronDown size={14} />
        </span>
      </button>

      {/* ── Price ── */}
      <div>
        <span className="text-2xl sm:text-3xl font-bold text-foreground">
          {selected ? selected.priceRetail : product.price} ₴
        </span>
      </div>

      <AddToCartButton product={productWithVariant} />

      {/* ── Bottom Sheet (mobile) / Modal (desktop) ── */}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center">
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-250 ${
              closing ? "opacity-0" : "opacity-100"
            }`}
            onClick={closeSheet}
          />

          {/* Sheet */}
          <div
            className={`
              relative w-full md:max-w-md md:mx-4
              bg-white
              rounded-t-3xl md:rounded-3xl
              shadow-2xl
              max-h-[85vh] md:max-h-[75vh]
              flex flex-col
              transition-transform duration-250 ease-out
              ${closing ? "translate-y-full md:translate-y-4 md:opacity-0" : "translate-y-0"}
            `}
          >
            {/* Drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-border shrink-0">
              <h3 className="text-base font-bold tracking-tight">
                Оберіть розмір обладнання
              </h3>
              <button
                onClick={closeSheet}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
              <div className="space-y-1 pb-2">
                {variants.map((v, idx) => {
                  const label = v.size || v.volume || ""
                  const isActive = idx === selectedIdx
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectAndClose(idx)}
                      className={`
                        w-full flex items-center justify-between
                        px-4 py-3.5 rounded-xl
                        transition-all duration-150
                        ${isActive
                          ? "bg-[#00B5D1] text-white shadow-sm"
                          : "bg-muted/40 text-foreground hover:bg-muted"
                        }
                      `}
                    >
                      <span className={`text-sm font-semibold ${isActive ? "" : ""}`}>
                        {label}
                      </span>

                      <span className={`text-sm font-bold ${isActive ? "text-white/90" : "text-foreground"}`}>
                        {v.priceRetail} грн
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Spacer for safe-area on iPhones */}
            <div className="pb-[env(safe-area-inset-bottom)] shrink-0" />
          </div>
        </div>
      )}
    </div>
  )
}
