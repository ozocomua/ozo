"use client"

import { useCart } from "@/lib/cart-context"
import { ShoppingCart } from "lucide-react"

export default function AddToCartButton({ product }: { product: any }) {
  const { addToCart } = useCart()

  const outOfStock = product.stock === 0

  if (outOfStock) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2 bg-muted text-muted-foreground text-sm font-semibold py-4 rounded-xl mb-3 w-full cursor-not-allowed"
      >
        Немає в наявності
      </button>
    )
  }

  return (
    <button
      onClick={() => addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        slug: product.slug,
        productId: product.id,
        maxStock: product.stock,
      })}
      className="flex items-center justify-center gap-2 bg-foreground text-background text-sm font-semibold py-4 rounded-xl hover:bg-foreground/90 active:scale-[0.98] transition-all duration-150 mb-3 w-full"
    >
      <ShoppingCart size={16} />
      Додати до кошика
    </button>
  )
}