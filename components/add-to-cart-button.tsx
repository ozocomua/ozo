"use client"

import { useCart } from "@/lib/cart-context"
import { ShoppingCart } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export default function AddToCartButton({ product }: { product: any }) {
  const { addToCart } = useCart()
  const [pulse, setPulse] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const outOfStock = product.stock === 0
  const price = typeof product.price === "number" ? product.price : 0

  // Pulse animation every 5 seconds
  useEffect(() => {
    const trigger = () => {
      setPulse(true)
      setTimeout(() => setPulse(false), 2000)
    }
    // First pulse after 2 seconds
    const initial = setTimeout(trigger, 2000)
    // Then every 5 seconds
    intervalRef.current = setInterval(trigger, 5000)
    return () => {
      clearTimeout(initial)
      clearInterval(intervalRef.current)
    }
  }, [])

  if (outOfStock) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2 bg-muted text-muted-foreground text-sm md:text-base font-semibold py-4 rounded-xl mb-3 w-full cursor-not-allowed"
      >
        Немає в наявності
      </button>
    )
  }

  return (
    <button
      onClick={() => addToCart({
        id: product.id,
        name: product.variantSize ? `${product.name} (${product.variantSize})` : product.name,
        price,
        image: product.image,
        slug: product.slug,
        productId: product.productId || product.id,
        variantSize: product.variantSize,
        maxStock: product.stock,
      })}
      className={`relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white text-sm md:text-base font-semibold py-4 rounded-xl hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-[0.98] transition-all duration-150 mb-3 w-full ${
        pulse ? "animate-bounce shadow-[0_0_35px_rgba(0,181,209,0.7)] ring-4 ring-[#00B5D1]/40" : "ring-2 ring-[#00B5D1]/25 animate-pulse"
      }`}
    >
      {/* Persistent glow */}
      <span className={`absolute inset-0 rounded-xl transition-opacity duration-500 ${pulse ? "opacity-0" : "opacity-100"}`}>
        <span className="absolute inset-0 rounded-xl ring-2 ring-[#00B5D1]/30 animate-ping pointer-events-none" />
      </span>
      <ShoppingCart size={18} />
      Додати до кошика
    </button>
  )
}