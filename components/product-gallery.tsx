"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

function resolveImageSrc(src: string): string {
  if (src.startsWith("/uploads/")) {
    return `/api/image/${src.replace("/uploads/", "")}`
  }
  return src
}

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

  return (
    <>
      {/* ── Normal gallery ── */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="relative aspect-square rounded-2xl overflow-hidden bg-secondary w-full cursor-zoom-in group"
          aria-label={`${mainAlt} — відкрити на повний екран`}
        >
          <Image
            src={resolveImageSrc(images[active] || "/placeholder.jpg")}
            alt={mainAlt}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 45vw, 500px"
            priority
          />
          {/* subtle zoom hint */}
          <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors" />

          {badge && (
            <span className="absolute top-3 left-3 bg-foreground text-background text-xs font-medium tracking-wide px-2.5 py-1 rounded-full">
              {badge}
            </span>
          )}
          {!badge && isPopular && (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-medium tracking-wide px-2.5 py-1 rounded-full">
              Популярний
            </span>
          )}
        </button>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
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
                  src={resolveImageSrc(src)}
                  alt={`${mainAlt} — фото ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

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

          {/* Image */}
          <div className="relative z-10 max-w-[95vw] max-h-[90vh] flex items-center justify-center">
            <img
              src={resolveImageSrc(images[active] || "/placeholder.jpg")}
              alt={mainAlt}
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg select-none"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
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
