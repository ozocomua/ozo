"use client"

import { useCart } from "@/lib/cart-context"
import { ShoppingCart } from "lucide-react"

export default function AddToCartButton({ product }: { product: any }) {
  const { addToCart } = useCart()

  const outOfStock = product.stock === 0
  // Price: variant products get selected.priceRetail set by ProductVariantPicker;
  // simple products get product.price from the storefront.
  const price = typeof product.price === "number" && product.price > 0
    ? product.price
    : 0

  if (outOfStock || price <= 0) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2 bg-muted text-muted-foreground text-sm md:text-base font-semibold py-4 rounded-xl mb-3 w-full cursor-not-allowed"
      >
        {price <= 0 && !outOfStock ? "Ціна не вказана" : "Немає в наявності"}
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
      className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white text-sm md:text-base font-semibold py-4 rounded-xl hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-[0.98] transition-all duration-150 mb-3 w-full"
    >
      <ShoppingCart size={18} />
      Додати до кошика
    </button>
  )
}