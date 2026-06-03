"use client"

import { useState } from "react"
import Image from "next/image"

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

  const mainAlt = (seoAlt?.trim() || name).replace(/<[^>]*>/g, "").trim()

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
        <Image
          src={resolveImageSrc(images[active] || "/placeholder.jpg")}
          alt={mainAlt}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 45vw, 500px"
          priority
        />
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
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
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
  )
}
