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

  const touchX = useRef(0)

  const lightboxPrev = useCallback(() => {
    setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const lightboxNext = useCallback(() => {
    setActive((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 60) {
      if (dx > 0) lightboxPrev()
      else lightboxNext()
    }
  }, [lightboxPrev, lightboxNext])

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
      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="relative aspect-square rounded-2xl overflow-hidden bg-secondary w-full md:flex-1 cursor-zoom-in group"
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
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:max-h-[500px] md:w-16 md:shrink-0">
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
                  src={normalizeImageUrl(src)}
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
          <div
            className="absolute inset-0 bg-black/90 cursor-zoom-out"
            onClick={() => setLightbox(false)}
          />

          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors shadow-lg"
          >
            <X size={24} />
          </button>

          {images.length > 1 && (
            <span className="absolute top-5 left-1/2 -translate-x-1/2 z-20 text-white/70 text-xs font-bold tracking-widest">
              {active + 1} / {images.length}
            </span>
          )}

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                lightboxPrev()
              }}
              className="absolute left-3 md:left-6 z-20 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors shadow-lg"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <div
            className="relative z-10 max-w-[95vw] max-h-[90vh] flex items-center justify-center select-none"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={normalizeImageUrl(images[active] || "/placeholder.jpg")}
              alt={mainAlt}
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                lightboxNext()
              }}
              className="absolute right-3 md:right-6 z-20 p-3 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors shadow-lg"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </>
  )
}
