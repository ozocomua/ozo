"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { normalizeImageUrl } from "@/lib/image-path"
import { Sparkles } from "lucide-react"

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
  suggestion?: string | null
  isFuzzy?: boolean
  onSelect: () => void
  onSuggestionClick?: (suggestion: string) => void
}

export default function SearchDropdown({
  results,
  searchQuery,
  suggestion,
  isFuzzy,
  onSelect,
  onSuggestionClick,
}: SearchDropdownProps) {
  const router = useRouter()

  if (searchQuery.length < 2) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
      {/* «Можливо, ви мали на увазі» підказка */}
      {isFuzzy && suggestion && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Можливо, ви мали на увазі:{" "}
              <button
                onClick={() => onSuggestionClick?.(suggestion)}
                className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              >
                {suggestion}
              </button>
            </p>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Нічого не знайдено
          </p>
          {isFuzzy && (
            <p className="text-xs text-muted-foreground/60 text-center mt-1">
              Спробуйте змінити пошуковий запит
            </p>
          )}
        </div>
      ) : (
        <>
          {isFuzzy && (
            <div className="px-4 py-1.5 bg-muted/30 border-b border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Знайдено за збігом
              </p>
            </div>
          )}
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
        </>
      )}
    </div>
  )
}
