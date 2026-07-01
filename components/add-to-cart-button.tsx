"use client"

import { useCart } from "@/lib/cart-context"
import { ShoppingCart } from "lucide-react"

export default function AddToCartButton({ product }: { product: any }) {
  const { addToCart } = useCart()

  const outOfStock = product.stock === 0
  // ProductVariantPicker already sets product.price = selected.priceRetail for variants.
  // Simple products get product.price from storefront-db.
  const price = typeof product.price === "number" ? product.price : 0

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
      className="flex items-center justify-center gap-2 border-2 border-[#00B5D1] text-[#00B5D1] text-sm md:text-base font-semibold py-3.5 rounded-xl hover:bg-[#00B5D1]/5 active:scale-[0.98] transition-all duration-150 mb-3 w-full"
    >
      <ShoppingCart size={18} />
      Додати до кошика
    </button>
  )
}
