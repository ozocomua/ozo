"use client"

import { useState, useEffect } from "react"
import { Phone, User, X, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

export default function ExitPopup() {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("+380")
  const [shown, setShown] = useState(false)

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

  useEffect(() => {
    if (shown) return

    // Show after 12 seconds on page
    const timer = setTimeout(() => {
      setOpen(true)
      setShown(true)
    }, 12000)

    // Also show on exit intent (mouse leaving to top of page)
    const handleExit = (e: MouseEvent) => {
      if (e.clientY < 30 && !shown && !open) {
        setOpen(true)
        setShown(true)
      }
    }
    document.addEventListener("mouseleave", handleExit)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mouseleave", handleExit)
    }
  }, [shown, open])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || phone.length < 19) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          comment: "📢 Автоматичний pop-up з сайту",
        }),
      })
      if (!res.ok) throw new Error("Помилка")
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 fade-in duration-300">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-black/5 text-black/40 hover:bg-black/10 transition-colors"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="py-12 text-center space-y-5 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Check size={36} />
            </div>
            <h3 className="text-2xl font-serif italic">Дякуємо!</h3>
            <p className="text-sm opacity-60 leading-relaxed">
              Наш менеджер зв'яжеться з вами найближчим часом
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                <Phone size={12} /> Безкоштовна консультація
              </div>
              <h3 className="text-xl md:text-2xl font-serif italic mt-3">
                Потрібна допомога з вибором?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Залиште номер телефону — ми передзвонимо, проконсультуємо та допоможемо підібрати обладнання для вашого господарства
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  required
                  className="w-full bg-muted/50 rounded-2xl py-4 pl-12 pr-4 text-base sm:text-sm outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                  placeholder="Ваше ім'я"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  className="w-full bg-muted/50 rounded-2xl py-4 pl-12 pr-4 text-base sm:text-sm font-mono outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !name.trim() || phone.length < 19}
              className="w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-5 rounded-2xl font-bold text-base hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-[#00B5D1]/20"
            >
              {submitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Передзвоніть мені"
              )}
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              Натискаючи кнопку, ви погоджуєтесь на обробку персональних даних
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
