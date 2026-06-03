"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { normalizeImageUrl } from "@/lib/image-path"

type CategoryItem = {
  id: number
  slug: string
  name: string
  imageUrl: string
}

export default function OtherCategoriesScroll({ categories }: { categories: CategoryItem[] }) {
  const [showArrow, setShowArrow] = useState(true)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollLeft > 10) {
      setShowArrow(false)
    } else {
      setShowArrow(true)
    }
  }

  if (!categories.length) return null

  return (
    <div>
      <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-4 px-1">
        Інші категорії
      </h2>
      <div className="relative w-full overflow-hidden">
        <div
          onScroll={handleScroll}
          className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-3 px-1 snap-x snap-mandatory"
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog/${cat.slug}`}
              className="snap-center shrink-0 relative w-40 h-24 md:w-48 md:h-28 rounded-lg overflow-hidden border border-border group"
            >
              <Image
                src={normalizeImageUrl(cat.imageUrl)}
                alt={cat.name}
                fill
                unoptimized
                className="object-cover grayscale-[40%] saturate-[65%] brightness-90 contrast-110 transition-all duration-500 group-hover:grayscale-0 group-hover:saturate-100 group-hover:scale-105"
                sizes="(max-width: 768px) 160px, 192px"
              />
              <div className="absolute inset-0 bg-neutral-900/40 group-hover:bg-neutral-900/50 transition-colors z-10" />
              <div className="absolute inset-0 flex items-center justify-center p-2 z-20 text-center">
                <span className="text-xs md:text-sm font-bold text-white tracking-wide uppercase">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div
          className={`pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pr-2 transition-opacity duration-300 z-30 ${
            showArrow ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center text-foreground mr-1 animate-pulse">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
