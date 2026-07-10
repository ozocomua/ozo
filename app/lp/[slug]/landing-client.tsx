"use client"

import { useState } from "react"
import { ShoppingCart, ArrowRight, Check } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"

export default function LandingClient({ landing }: { landing: any }) {
  const { addToCart } = useCart()
  const product = landing.product
  const defVariant = product.variants?.[0]
  const mainImg = product.images?.find((i: any) => i.isMain)?.url || product.images?.[0]?.url || "/placeholder.jpg"
  const images = product.images?.map((i: any) => i.url) || []
  const price = defVariant?.priceRetail ?? product.price ?? 0
  const oldPrice = product.oldPrice
  const inStock = (defVariant?.stock ?? product.stock ?? 0) > 0

  const [adding, setAdding] = useState(false)

  async function handleBuy() {
    setAdding(true)
    await addToCart(product.id, 1)
    toast.success("Додано в кошик!")
    setTimeout(() => {
      window.location.href = "/checkout"
    }, 400)
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: landing.bgColor, color: landing.textColor }}>
      {/* Header */}
      <header className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between">
        <a href="/" className="font-serif text-2xl font-black tracking-wider opacity-70 hover:opacity-100 transition-opacity" style={{ color: landing.textColor }}>
          OZO
        </a>
        <button
          onClick={handleBuy}
          disabled={!inStock || adding}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-all disabled:opacity-40 shadow-lg"
          style={{ backgroundColor: landing.btnColor }}
        >
          <ShoppingCart size={16} />
          {landing.ctaText}
        </button>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-8 pb-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left — text */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif italic leading-tight">
              {landing.title}
            </h1>
            {landing.subtitle && (
              <p className="text-lg opacity-60 leading-relaxed max-w-md">
                {landing.subtitle}
              </p>
            )}

            {/* Product name + price */}
            <div className="space-y-2">
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">
                {product.name}
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black">{price.toFixed(0)} ₴</span>
                {oldPrice && oldPrice > price && (
                  <span className="text-lg line-through opacity-40">{oldPrice.toFixed(0)} ₴</span>
                )}
              </div>
            </div>

            {/* Stock badge */}
            <div className="flex items-center gap-2">
              {inStock ? (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-bold">
                  <Check size={16} /> В наявності
                </span>
              ) : (
                <span className="text-sm text-red-500 font-bold">Немає в наявності</span>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleBuy}
              disabled={!inStock || adding}
              className="flex items-center gap-3 px-8 py-5 rounded-2xl text-white font-bold text-lg active:scale-95 transition-all disabled:opacity-40 shadow-xl hover:shadow-2xl w-full sm:w-auto justify-center"
              style={{ backgroundColor: landing.btnColor }}
            >
              {adding ? "Додаємо..." : (
                <>
                  {landing.ctaText}
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            {/* Delivery info */}
            <div className="flex flex-wrap gap-4 text-xs opacity-40 font-medium">
              <span>🚚 Доставка Новою Поштою</span>
              <span>📦 1–3 дні</span>
              <span>💳 Оплата при отриманні</span>
            </div>
          </div>

          {/* Right — images */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden bg-white shadow-2xl aspect-[4/5] flex items-center justify-center p-8">
              <img
                src={mainImg}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {images.slice(0, 4).map((url: string, i: number) => (
                  <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features / description */}
      {product.fullDescription && (
        <section className="bg-white/50 py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-serif italic mb-6 text-center">Про товар</h2>
            <div className="prose prose-sm max-w-none opacity-70 leading-relaxed text-center whitespace-pre-line">
              {product.fullDescription}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 text-center text-xs opacity-30">
        © {new Date().getFullYear()} OZO. Всі права захищені.
      </footer>
    </div>
  )
}
