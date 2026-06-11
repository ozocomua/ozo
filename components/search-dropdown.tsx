"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { normalizeImageUrl } from "@/lib/image-path"

type SearchProduct = {
  id: number
  name: string
  slug: string
  price: number
  oldPrice: number | null
  image: string | null
}

interface SearchDropdownProps {
  results: SearchProduct[]
  searchQuery: string
  onSelect: () => void
}

export default function SearchDropdown({ results, searchQuery, onSelect }: SearchDropdownProps) {
  const router = useRouter()

  if (searchQuery.length < 2) return null

  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl z-50 p-4">
        <p className="text-sm text-muted-foreground text-center">Нічого не знайдено</p>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
      {results.map((product) => (
        <Link
          key={product.id}
          href={`/product/${product.slug}`}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect()
            router.push(`/product/${product.slug}`)
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors border-b border-border last:border-0 cursor-pointer"
        >
          <div className="w-10 h-10 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
            {product.image ? (
              <Image
                src={normalizeImageUrl(product.image || "")}
                alt={product.name}
                width={40}
                height={40}
                unoptimized
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {product.name}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {product.oldPrice} ₴
              </span>
            )}
            <span className="text-sm font-bold text-foreground">
              {product.price} ₴
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
