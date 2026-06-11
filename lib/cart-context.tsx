"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { X, ArrowRight, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface CartItem {
  id: number | string
  name: string
  price: number
  quantity: number
  image?: string
  slug?: string
  productId?: number
  variantSize?: string
  maxStock?: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: any) => void
  removeFromCart: (id: number | string) => void
  updateQuantity: (id: number | string, delta: number) => void
  clearCart: () => void
  cartTotal: number
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  refreshPrices: () => void
  pricesRefreshed: boolean
  hydrated: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pricesRefreshed, setPricesRefreshed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('ozo-cart')
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        setCart(parsed)
        if (parsed.length > 0) {
          refreshPricesImpl(parsed)
        } else {
          setPricesRefreshed(true)
        }
      } catch {
        console.warn('Failed to parse cart from localStorage, resetting.')
        localStorage.removeItem('ozo-cart')
        setPricesRefreshed(true)
      }
    } else {
      setPricesRefreshed(true)
    }
    setHydrated(true)
  }, [])

  const refreshPricesImpl = async (currentCart?: CartItem[]) => {
    const itemsToCheck = currentCart ?? cart
    const productIds = [...new Set(
      itemsToCheck
        .map((item) => Number(item.productId ?? item.id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )]
    if (!productIds.length) {
      setPricesRefreshed(true)
      return
    }
    try {
      const res = await fetch(`/api/catalog?ids=${productIds.join(",")}`)
      const data = await res.json()
      const fresh: { id: number; price: number; stock: number }[] = data.products ?? []
      const priceMap = new Map(fresh.map((p) => [p.id, p]))

      setCart((prev) =>
        prev.map((item) => {
          const pid = Number(item.productId ?? item.id)
          const freshProduct = priceMap.get(pid)
          if (!freshProduct) return item
          // Variant items keep their chosen price; simple items get refreshed
          const updatedPrice = item.variantSize ? item.price : freshProduct.price
          return {
            ...item,
            price: updatedPrice,
            maxStock: freshProduct.stock,
          }
        })
      )
    } catch {
      /* silent — keep cart as-is if network fails */
    } finally {
      setPricesRefreshed(true)
    }
  }

  const refreshPrices = () => {
    setPricesRefreshed(false)
    refreshPricesImpl()
  }

  useEffect(() => {
    if (isModalOpen) {
      refreshPrices()
    }
  }, [isModalOpen])

  useEffect(() => {
    localStorage.setItem('ozo-cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: any) => {
    const max = product.maxStock ?? 999
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity >= max) {
          toast.error(`Не можна додати більше, ніж ${max} шт., оскільки це весь доступний залишок.`)
          return prev
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setIsModalOpen(true)
  }

  const updateQuantity = (id: number | string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item
        const max = item.maxStock ?? 999
        if (delta > 0 && item.quantity >= max) {
          toast.error(`Не можна додати більше, ніж ${max} шт., оскільки це весь доступний залишок.`)
          return item
        }
        const next = item.quantity + delta
        return { ...item, quantity: next }
      })
      return updated.filter(item => item.quantity > 0)
    })
  }

  const removeFromCart = (id: number | string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => setCart([])
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, isModalOpen, setIsModalOpen, refreshPrices, pricesRefreshed, hydrated }}>
      {children}
      
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          
          <div className="relative bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10 flex flex-col max-h-[85vh]">
              
              <div className="flex justify-between items-center mb-8 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-serif tracking-tight">Кошик</h3>
                  <span className="bg-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {cart.length}
                  </span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-secondary rounded-full transition-all active:scale-90"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-8 custom-scrollbar">
                {cart.length > 0 && (
                  <>
                    {/* Free shipping progress bar */}
                    {(() => {
                      const FREE_SHIPPING_LIMIT = 2500
                      const amountLeft = FREE_SHIPPING_LIMIT - cartTotal
                      const progressPct = Math.min((cartTotal / FREE_SHIPPING_LIMIT) * 100, 100)
                      const reached = cartTotal >= FREE_SHIPPING_LIMIT
                      return (
                        <div className="rounded-2xl bg-gradient-to-r from-[#0B53A4]/5 to-[#00B5D1]/10 border border-[#00B5D1]/20 p-4 space-y-2">
                          <div className="flex justify-between items-baseline gap-2">
                            <p className="text-[11px] font-bold text-foreground/80">
                              {reached
                                ? "🎉 Вітаємо! Ви отримали БЕЗКОШТОВНУ доставку Новою Поштою!"
                                : <>Додайте товари ще на <span className="text-[#0B53A4] font-black">🔥 {amountLeft} грн</span> для БЕЗКОШТОВНОЇ доставки!</>
                              }
                            </p>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ease-out ${reached ? "bg-emerald-500" : "bg-[#00B5D1]"}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })()}

                    {cart.map((item) => (
                    <div key={item.id} className="flex gap-5 items-center pb-6 border-b border-black/[0.05] last:border-0 last:pb-0">
                      {item.slug ? (
                        <Link href={`/product/${item.slug}`} onClick={() => setIsModalOpen(false)} className="w-20 h-20 bg-secondary rounded-2xl overflow-hidden flex-shrink-0 border border-black/[0.03]">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          )}
                        </Link>
                      ) : (
                        <div className="w-20 h-20 bg-secondary rounded-2xl overflow-hidden flex-shrink-0 border border-black/[0.03]">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {item.slug ? (
                          <Link href={`/product/${item.slug}`} onClick={() => setIsModalOpen(false)} className="block">
                            <h4 className="font-bold text-sm md:text-base truncate mb-0.5 hover:opacity-70 transition-opacity">{item.name}</h4>
                          </Link>
                        ) : (
                          <h4 className="font-bold text-base truncate mb-0.5">{item.name}</h4>
                        )}
                        <p className="text-muted-foreground font-semibold text-sm">{item.price} ₴</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                         <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-2.5 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="flex items-center bg-secondary rounded-xl p-0.5 border border-black/[0.03]">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-all shadow-sm"><Minus size={16} /></button>
                            <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-all shadow-sm"><Plus size={16} /></button>
                          </div>
                      </div>
                    </div>
                  ))
                </>
                )}
                {cart.length === 0 && (
                  <div className="py-16 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-muted-foreground"><ShoppingBag size={24} /></div>
                    <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Кошик порожній</p>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="flex-shrink-0 pt-4 border-t border-black/5 mt-auto">
                  <div className="flex justify-between items-end mb-8">
                    <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground font-extrabold">Всього</span>
                    <span className="text-3xl font-black tracking-tighter leading-none">{cartTotal} ₴</span>
                  </div>
                  <Link 
                    href="/checkout" 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:from-[#0c5db8] hover:to-[#00c5e3] transition-all active:scale-[0.98]"
                  >
                    ОФОРМИТИ ЗАМОВЛЕННЯ
                    <ArrowRight size={18} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}