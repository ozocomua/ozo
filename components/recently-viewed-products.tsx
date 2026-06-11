"use client"

import Link from "next/link"
import Image from "next/image"
import { useRecentlyViewed } from "@/lib/recently-viewed-context"
import { normalizeImageUrl } from "@/lib/image-path"
import { Eye } from "lucide-react"

export default function RecentlyViewedProducts() {
  const { items } = useRecentlyViewed()

  if (items.length < 2) return null

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h3 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Eye size={18} className="text-muted-foreground" />
        Нещодавно переглянуті
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.slice(1, 5).map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors"
          >
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={normalizeImageUrl(product.image)}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground line-clamp-1">{product.name}</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{product.price} ₴</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
