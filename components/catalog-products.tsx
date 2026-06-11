"use client"

import { useState, useCallback, useMemo } from "react"
import ProductCard from "@/components/product-card"
import type { StorefrontProduct } from "@/lib/storefront-db"

interface CatalogProductsProps {
  initialProducts: StorefrontProduct[]
  total: number
  pageSize?: number
  fetchUrl: string
}

export default function CatalogProducts({ initialProducts, total, pageSize = 24, fetchUrl }: CatalogProductsProps) {
  const [sort, setSort] = useState<string>("default")
  const [products, setProducts] = useState<StorefrontProduct[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [inStockOnly, setInStockOnly] = useState(false)

  const filtered = useMemo(() => {
    let result = [...products]

    // Filter by price
    const min = parseFloat(minPrice)
    const max = parseFloat(maxPrice)
    if (!isNaN(min)) {
      result = result.filter(p => {
        const price = p.variants?.[0]?.priceRetail ?? p.price ?? 0
        return price >= min
      })
    }
    if (!isNaN(max)) {
      result = result.filter(p => {
        const price = p.variants?.[0]?.priceRetail ?? p.price ?? 0
        return price <= max
      })
    }

    // Filter by stock
    if (inStockOnly) {
      result = result.filter(p => p.stock > 0)
    }

    // Sort
    const pA_raw = (a: any) => (a.variants?.[0]?.priceRetail ?? a.price) || 0
    const pB_raw = (b: any) => (b.variants?.[0]?.priceRetail ?? b.price) || 0
    result.sort((a, b) => {
      switch (sort) {
        case "price_asc": return pA_raw(a) - pA_raw(b)
        case "price_desc": return pA_raw(b) - pA_raw(a)
        default: return 0
      }
    })

    return result
  }, [products, sort, minPrice, maxPrice, inStockOnly])

  const hasMore = products.length < total

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const separator = fetchUrl.includes("?") ? "&" : "?"
      const url = `${fetchUrl}${separator}skip=${products.length}&take=${pageSize}${sort !== "default" ? `&sort=${sort}` : ""}`
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data.products)) {
        setProducts((prev) => [...prev, ...data.products])
      }
    } finally {
      setLoading(false)
    }
  }, [products.length, pageSize, fetchUrl, sort])

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
        <p className="text-sm text-muted-foreground">
          {products.length} товарів
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1] outline-none"
        >
          <option value="default">За замовчуванням</option>
          <option value="price_asc">Від дешевих до дорогих</option>
          <option value="price_desc">Від дорогих до дешевих</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Мін. ціна"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-24 text-sm border border-border rounded-lg px-3 py-2 bg-white focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1] outline-none"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <input
            type="number"
            placeholder="Макс. ціна"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-24 text-sm border border-border rounded-lg px-3 py-2 bg-white focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1] outline-none"
          />
        </div>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded border-border text-[#00B5D1] focus:ring-[#00B5D1]"
          />
          В наявності
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="border border-[#00B5D1] text-[#00B5D1] hover:bg-gradient-to-r hover:from-[#0B53A4] hover:to-[#00B5D1] hover:text-white hover:border-transparent transition-all px-6 sm:px-8 py-2.5 sm:py-3 text-sm uppercase tracking-wider font-medium"
          >
            {loading ? "Завантаження..." : "Показати ще"}
          </button>
        </div>
      )}
    </>
  )
}
