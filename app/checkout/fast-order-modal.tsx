"use client"

import { useState } from "react"
import { Loader2, Phone, Send, WifiOff } from "lucide-react"

type Props = {
  onClose: () => void
}

export default function FastOrderModal({ onClose }: Props) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("+380")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    if (!name.trim()) {
      setError("Будь ласка, вкажіть ваше ім'я")
      return
    }
    const raw = phone.replace(/[\s\-()+]/g, "")
    if (raw.length < 10) {
      setError("Будь ласка, вкажіть коректний номер телефону")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/fast-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setSent(true)
      } else {
        setError(data.error || "Не вдалося надіслати. Спробуйте ще раз.")
      }
    } catch {
      setError("Помилка мережі. Перевірте з'єднання та спробуйте ще раз.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={sent ? onClose : undefined} />

      <div className="relative bg-white w-full max-w-[420px] rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
        {/* header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <WifiOff size={20} />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-tight">
                Слабкий інтернет?
              </h3>
              <p className="text-[10px] font-bold opacity-80">
                Ми самі вам зателефонуємо!
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {sent ? (
            /* success */
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Send size={28} className="text-green-600" />
              </div>
              <h4 className="font-black text-lg text-foreground">
                Дякуємо!
              </h4>
              <p className="text-sm text-muted-foreground">
                Менеджер вже зв'язується з вами.
              </p>
              <button
                onClick={onClose}
                className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Закрити
              </button>
            </div>
          ) : (
            /* form */
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Ваше ім'я
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Олександр"
                  autoComplete="name"
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Номер телефону
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380 77 868 77 77"
                  autoComplete="tel"
                  inputMode="tel"
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
                />
              </div>

              {error ? (
                <p className="text-[11px] font-bold text-red-500 text-center">{error}</p>
              ) : null}

              <button
                onClick={handleSubmit}
                disabled={sending}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 hover:from-orange-600 hover:to-amber-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Phone size={18} />
                )}
                {sending ? "Надсилаємо..." : "Передзвоніть мені"}
              </button>

              <button
                onClick={onClose}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Скасувати
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
