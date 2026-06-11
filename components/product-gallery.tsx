"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { normalizeImageUrl } from "@/lib/image-path"

export default function ProductGallery({
  images,
  name,
  badge,
  isPopular,
  seoAlt,
}: {
  images: string[]
  name: string
  badge?: string | null
  isPopular?: boolean
  seoAlt?: string | null
}) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const mainAlt = (seoAlt?.trim() || name).replace(/<[^>]*>/g, "").trim()

  /* ── Touch swipe for lightbox ── */
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    // Only swipe if horizontal movement > vertical (avoid vertical scroll conflicts)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < -50 && active < images.length - 1) setActive(active + 1)
      else if (dx > 50 && active > 0) setActive(active - 1)
    }
  }

  /* ── Keyboard navigation inside lightbox ── */
  const lightboxPrev = useCallback(() => {
    setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const lightboxNext = useCallback(() => {
    setActive((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false)
      else if (e.key === "ArrowLeft") lightboxPrev()
      else if (e.key === "ArrowRight") lightboxNext()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [lightbox, lightboxPrev, lightboxNext])

  /* ── Lock body scroll ── */
  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [lightbox])

  const badgeElement = badge ? (
    <span className="absolute top-3 left-3 bg-foreground text-background text-xs font-medium tracking-wide px-2.5 py-1 rounded-full z-10">
      {badge}
    </span>
  ) : isPopular ? (
    <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-medium tracking-wide px-2.5 py-1 rounded-full z-10">
      Популярний
    </span>
  ) : null

  /* ── Thumbnails (reusable) ── */
  const thumbnails = images.map((src, i) => (
    <button
      key={i}
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setActive(i)
      }}
      className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
        i === active
          ? "border-foreground"
          : "border-border hover:border-foreground/30"
      }`}
    >
      <Image
        src={normalizeImageUrl(src)}
        alt={`${mainAlt} — фото ${i + 1}`}
        fill
        className="object-cover"
        sizes="64px"
        unoptimized
      />
    </button>
  ))

  return (
    <>
      {/* ── Normal gallery ── */}
      {images.length > 1 ? (
        <>
          {/* Desktop: main image left + thumbnails right */}
          <div className="hidden md:flex gap-3">
            {/* Main image */}
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="relative aspect-square rounded-2xl overflow-hidden bg-secondary flex-1 cursor-zoom-in group order-1"
              aria-label={`${mainAlt} — відкрити на повний екран`}
            >
              <Image
                src={normalizeImageUrl(images[active] || "/placeholder.jpg")}
                alt={mainAlt}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 1200px) 45vw, 500px"
                priority
              />
              <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />
              {badgeElement}
            </button>

            {/* Thumbnails — right column */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 order-2" style={{ maxHeight: "500px" }}>
              {thumbnails}
            </div>
          </div>

          {/* Mobile: main image above + thumbnails below */}
          <div className="md:hidden space-y-3">
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="relative aspect-square rounded-2xl overflow-hidden bg-secondary w-full cursor-zoom-in group"
              aria-label={`${mainAlt} — відкрити на повний екран`}
            >
              <Image
                src={normalizeImageUrl(images[active] || "/placeholder.jpg")}
                alt={mainAlt}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) calc(100vw - 32px), 100vw"
                priority
              />
              <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />
              {badgeElement}
            </button>

            <div className="flex gap-2 overflow-x-auto">
              {thumbnails}
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="relative aspect-square rounded-2xl overflow-hidden bg-secondary w-full cursor-zoom-in group"
          aria-label={`${mainAlt} — відкрити на повний екран`}
        >
          <Image
            src={normalizeImageUrl(images[active] || "/placeholder.jpg")}
            alt={mainAlt}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 768px) calc(100vw - 64px), (max-width: 1200px) 45vw, 500px"
            priority
          />
          <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />
          {badgeElement}
        </button>
      )}

      {/* ── Fullscreen Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center">
          {/* Dark backdrop */}
          <div
            className="absolute inset-0 bg-black/90 cursor-zoom-out"
            onClick={() => setLightbox(false)}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Image counter */}
          {images.length > 1 && (
            <span className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white/70 text-xs font-bold tracking-widest">
              {active + 1} / {images.length}
            </span>
          )}

          {/* Prev arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                lightboxPrev()
              }}
              className="absolute left-3 md:left-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Image — touch-swipeable */}
          <div
            className="relative z-10 max-w-[95vw] max-h-[90vh] flex items-center justify-center select-none"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={normalizeImageUrl(images[active] || "/placeholder.jpg")}
              alt={mainAlt}
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Next arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                lightboxNext()
              }}
              className="absolute right-3 md:right-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </>
  )
}
