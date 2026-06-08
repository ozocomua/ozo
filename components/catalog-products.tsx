"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUpDown, Check } from "lucide-react"
import ProductCard from "@/components/product-card"
import type { StorefrontProduct } from "@/lib/storefront-db"

interface CatalogProductsProps {
  initialProducts: StorefrontProduct[]
  total: number
  pageSize?: number
  fetchUrl: string
  sort?: string
}

const SORT_OPTIONS = [
  { value: "", label: "За замовчуванням" },
  { value: "price_asc", label: "Від дешевих до дорогих" },
  { value: "price_desc", label: "Від дорогих до дешевих" },
]

function sortProducts(products: StorefrontProduct[], sort: string): StorefrontProduct[] {
  const sorted = [...products]
  switch (sort) {
    case "price_asc":
      sorted.sort((a, b) => a.price - b.price)
      break
    case "price_desc":
      sorted.sort((a, b) => b.price - a.price)
      break
    default:
      break
  }
  return sorted
}

export default function CatalogProducts({ initialProducts, total, pageSize = 24, fetchUrl, sort: initialSort }: CatalogProductsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sort = initialSort ?? searchParams.get("sort") ?? ""

  const sortedInitial = useMemo(() => sortProducts(initialProducts, sort), [initialProducts, sort])

  const [products, setProducts] = useState<StorefrontProduct[]>(sortedInitial)
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const activeLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? SORT_OPTIONS[0].label

  const hasMore = products.length < total

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const separator = fetchUrl.includes("?") ? "&" : "?"
      const url = `${fetchUrl}${separator}skip=${products.length}&take=${pageSize}${sort ? `&sort=${sort}` : ""}`
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data.products)) {
        setProducts((prev) => {
          const merged = [...prev, ...data.products]
          return sortProducts(merged, sort)
        })
      }
    } finally {
      setLoading(false)
    }
  }, [products.length, pageSize, fetchUrl, sort])

  const handleSortChange = useCallback(
    (value: string) => {
      setDropdownOpen(false)
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("sort", value)
      } else {
        params.delete("sort")
      }
      router.push(`?${params.toString()}`, { scroll: false })
      setProducts((prev) => sortProducts(prev, value))
    },
    [router, searchParams],
  )

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm">Немає товарів</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          {total} товарів
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-2 text-xs uppercase font-bold tracking-widest border border-border rounded-full px-4 py-2 hover:border-foreground transition-colors"
          >
            <ArrowUpDown size={14} />
            {activeLabel}
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-border rounded-2xl shadow-lg overflow-hidden min-w-[220px]">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSortChange(option.value)}
                    className={`flex items-center justify-between w-full px-4 py-3 text-xs text-left transition-colors hover:bg-secondary ${
                      sort === option.value ? "font-bold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {option.label}
                    {sort === option.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all px-8 py-3 text-sm uppercase tracking-wider font-medium"
          >
            {loading ? "Завантаження..." : "Показати ще"}
          </button>
        </div>
      )}
    </>
  )
}
