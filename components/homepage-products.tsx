"use client"

import { useState, useCallback } from "react"
import ProductCard from "@/components/product-card"
import type { StorefrontProduct } from "@/lib/storefront-db"

interface HomepageProductsProps {
  initialProducts: StorefrontProduct[]
  total: number
  pageSize?: number
}

export default function HomepageProducts({ initialProducts, total, pageSize = 12 }: HomepageProductsProps) {
  const [products, setProducts] = useState<StorefrontProduct[]>(initialProducts)
  const [loading, setLoading] = useState(false)

  const hasMore = products.length < total

  const loadMore = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products?skip=${products.length}&take=${pageSize}`)
      const data = await res.json()
      if (Array.isArray(data.products)) {
        setProducts((prev) => [...prev, ...data.products])
      }
    } finally {
      setLoading(false)
    }
  }, [products.length, pageSize])

  return (
    <section className="max-w-5xl mx-auto px-4 pt-8 pb-2">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Всі продукти
        </h2>
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
    </section>
  )
}
