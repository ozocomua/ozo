"use client"

import { useState } from "react"
import { Phone, User, X, Loader2, Check, Zap } from "lucide-react"
import { toast } from "sonner"

interface QuickOrderModalProps {
  open: boolean
  onClose: () => void
  productName: string
  productId: number
  price: number
  variantSize?: string
}

function QuickOrderModal({ open, onClose, productName, productId, price, variantSize }: QuickOrderModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("+380")

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return "+380"
    let formatted = "+380"
    if (numbers.length > 3) formatted += " (" + numbers.substring(3, 5)
    if (numbers.length > 5) formatted += ") " + numbers.substring(5, 8)
    if (numbers.length > 8) formatted += "-" + numbers.substring(8, 10)
    if (numbers.length > 10) formatted += "-" + numbers.substring(10, 12)
    return formatted
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/quick-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          productId,
          productName: variantSize ? `${productName} (${variantSize})` : productName,
          price,
        }),
      })
      if (!res.ok) throw new Error("Помилка")
      setSuccess(true)
      toast.success("Замовлення прийнято! Менеджер зателефонує.")
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setName("")
        setPhone("+380")
      }, 3000)
    } catch {
      toast.error("Помилка, спробуйте ще раз")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-md p-6 pt-8 animate-in slide-in-from-bottom-4 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-black/5 text-black/40 hover:bg-black/10">
          <X size={18} />
        </button>

        {success ? (
          <div className="py-10 text-center space-y-4 animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white rounded-full flex items-center justify-center mx-auto">
              <Check size={30} />
            </div>
            <h3 className="text-xl font-serif italic">Прийнято!</h3>
            <p className="text-xs opacity-60 uppercase font-bold">Менеджер зв'яжеться з вами найближчим часом</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-xl font-serif italic">Швидке замовлення</h3>
              <p className="text-xs text-muted-foreground mt-1">{productName} — {price} ₴</p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold opacity-40 ml-4">Ім'я *</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  required
                  className="w-full bg-muted/50 rounded-2xl py-3.5 pl-11 pr-4 text-base sm:text-sm outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                  placeholder="Ваше ім'я"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold opacity-40 ml-4">Телефон *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  required
                  type="tel"
                  className="w-full bg-muted/50 rounded-2xl py-3.5 pl-11 pr-4 text-base sm:text-sm font-mono outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !name.trim() || phone.length < 19}
              className="w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-4 rounded-xl font-bold text-sm hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : "Відправити замовлення"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function QuickOrderButton({
  product,
}: {
  product: {
    id: number
    name: string
    price: number
    productId?: number
    variantSize?: string
  }
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 border-2 border-[#00B5D1] text-[#00B5D1] font-semibold py-3.5 rounded-xl hover:bg-[#00B5D1]/5 active:scale-[0.98] transition-all duration-150 mb-3 w-full text-sm md:text-base"
      >
        <Zap size={16} />
        Швидке замовлення
      </button>
      <QuickOrderModal
        open={open}
        onClose={() => setOpen(false)}
        productName={product.name}
        productId={product.productId || product.id}
        price={product.price}
        variantSize={product.variantSize}
      />
    </>
  )
}
