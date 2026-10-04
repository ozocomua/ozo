"use client"

import { useState } from "react"
import { Star, ShoppingCart, Phone, User, Send, Shield, Truck, RotateCcw, Check, Scissors, Sprout, Droplets, Wrench, Clock, Zap, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { maskPhoneInput, stripPhoneFormatting, isValidPhone } from "@/lib/phone-format"

type ReviewType = { name: string; city: string; text: string; avatar: string; rating: number }

/* ── Icon mapper ── */
function renderIcon(name: string, size: number, className: string) {
  const cls = `${className}`
  switch (name) {
    case "Scissors": return <Scissors size={size} className={cls} />
    case "Sprout": return <Sprout size={size} className={cls} />
    case "Shield": return <Shield size={size} className={cls} />
    case "Check": return <Check size={size} className={cls} />
    case "Truck": return <Truck size={size} className={cls} />
    case "Zap": return <Zap size={size} className={cls} />
    case "Star": return <Star size={size} className={cls} />
    case "Award": return <span role="img" aria-label="award" className={cls} style={{ fontSize: size }}>🏆</span>
    case "Droplets": return <span role="img" aria-label="droplet" className={cls} style={{ fontSize: size }}>💧</span>
    case "Wrench": return <span role="img" aria-label="wrench" className={cls} style={{ fontSize: size }}>🔧</span>
    case "Clock": return <span role="img" aria-label="clock" className={cls} style={{ fontSize: size }}>🕐</span>
    case "Phone": return <span role="img" aria-label="phone" className={cls} style={{ fontSize: size }}>📱</span>
    default: return <Check size={size} className={cls} />
  }
}

/* ── FAQ item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/5 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left text-sm font-semibold text-foreground">
        {q}
        <ChevronDown size={16} className={`shrink-0 ml-2 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  )
}

/* ═══════ MAIN ═══════ */
export default function LandingClient({ landing }: { landing: any }) {
  const images: string[] = (Array.isArray(landing.productImages) && landing.productImages.length > 0)
    ? landing.productImages : landing.productImage ? [landing.productImage] : []
  const mainImg = images[0] || "/placeholder.jpg"
  const price = landing.productPrice || 0
  const oldPrice = landing.productOldPrice || null
  const discountPercent = landing.discountPercent ?? 0

  const advantages: { icon: string; title: string; desc: string }[] =
    (Array.isArray(landing.advantages) && landing.advantages.length > 0)
      ? landing.advantages
      : [
          { icon: "Shield", title: "Надійність", desc: "Перевірено роками в реальних умовах." },
          { icon: "Truck", title: "Швидка доставка", desc: "Відправляємо Новою Поштою в день замовлення." },
          { icon: "Check", title: "Гарантія якості", desc: "12 місяців гарантії та підтримка." },
          { icon: "RotateCcw", title: "Легке повернення", desc: "14 днів на повернення без зайвих питань." },
        ]

  const reviews: ReviewType[] = Array.isArray(landing.reviews) && landing.reviews.length > 0
    ? landing.reviews
    : [
        { name: "Андрій", city: "Київ", text: "Швидка доставка, якісний товар. Рекомендую!", avatar: "", rating: 5 },
        { name: "Олена", city: "Львів", text: "Все сподобалось, замовлення оформили за хвилину.", avatar: "", rating: 5 },
        { name: "Ігор", city: "Дніпро", text: "Працює відмінно, вдячний за консультацію.", avatar: "", rating: 5 },
      ]

  // Order form state
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("+380")
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(phone)) { toast.error("Введіть повний номер телефону"); return }
    setSending(true)
    try {
      const res = await fetch("/api/checkout/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: landing.productName || landing.title,
          price, qty: 1,
          slug: landing.slug, name: name.trim(), phone: stripPhoneFormatting(phone),
        }),
      })
      if (res.ok) {
        setDone(true)
        toast.success("Замовлення прийнято! Очікуйте дзвінка менеджера.")
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "Помилка")
      }
    } catch {
      toast.error("Мережева помилка")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-foreground font-sans">

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-black/5" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-5xl mx-auto h-14 px-4 flex items-center justify-between">
          <span className="font-black text-xl tracking-wider text-[#0B53A4]">OZO</span>
          <a href="#order" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-semibold text-sm rounded-full active:scale-95 transition-all">
            <ShoppingCart size={15} /> {landing.ctaText || "Замовити"}
          </a>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="bg-gradient-to-br from-[#0B53A4] via-[#0a5db8] to-[#00B5D1] text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-balance">{landing.title}</h1>
            {landing.subtitle && <p className="text-white/85 text-base md:text-lg leading-relaxed">{landing.subtitle}</p>}

            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-black">{price} ₴</span>
              {oldPrice && discountPercent > 0 && <span className="text-lg line-through opacity-50">{oldPrice} ₴</span>}
              {discountPercent > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discountPercent}%</span>}
            </div>

            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2"><Check size={16} className="text-white shrink-0" /> Доставка Новою Поштою по всій Україні</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-white shrink-0" /> Оплата при отриманні</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-white shrink-0" /> Відправка в день замовлення</li>
            </ul>

            <a href="#order" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-[#0B53A4] font-bold text-base rounded-xl hover:bg-white/95 active:scale-[0.98] transition-all shadow-lg">
              <ShoppingCart size={18} /> Замовити зараз
            </a>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-white p-3 shadow-2xl">
              <img src={mainImg} alt={landing.title} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="bg-white border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 py-5 grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <Truck size={22} className="text-[#00B5D1]" />
            <p className="text-xs font-semibold">Доставка 1–3 дні</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Shield size={22} className="text-[#00B5D1]" />
            <p className="text-xs font-semibold">Гарантія 12 міс.</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <RotateCcw size={22} className="text-[#00B5D1]" />
            <p className="text-xs font-semibold">Повернення 14 днів</p>
          </div>
        </div>
      </section>

      {/* ═══ ADVANTAGES ═══ */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Чому обирають OZO?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {advantages.map((a, i) => (
              <div key={i} className="bg-[#F6F9FC] border border-black/5 rounded-2xl p-5 flex items-start gap-4">
                <div className="bg-gradient-to-br from-[#0B53A4] to-[#00B5D1] rounded-xl p-2.5 shrink-0 text-white">{renderIcon(a.icon, 22, "")}</div>
                <div>
                  <p className="font-bold text-sm">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ORDER FORM ═══ */}
      <section id="order" className="py-14 bg-[#F6F9FC]">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-black/5 p-6 md:p-8">
            <h2 className="text-2xl font-black text-center mb-2">Оформити замовлення</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {landing.productName || landing.title} — <b>{price} ₴</b>
            </p>

            {done ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check size={28} className="text-emerald-600" />
                </div>
                <p className="font-bold text-lg">Дякуємо!</p>
                <p className="text-sm text-muted-foreground">Замовлення прийнято. Менеджер передзвонить протягом 15 хвилин.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ім'я</label>
                  <div className="relative mt-1.5">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше ім'я" className="w-full h-12 rounded-xl border border-black/10 pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Телефон *</label>
                  <div className="relative mt-1.5">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input value={phone} onChange={e => setPhone(maskPhoneInput(e.target.value).masked)} placeholder="+38 (097) 233-63-21" required className="w-full h-12 rounded-xl border border-black/10 pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 h-13 py-3.5 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-bold text-base rounded-xl hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-[0.98] transition-all disabled:opacity-60">
                  <Send size={16} />
                  {sending ? "Відправляємо..." : "Підтвердити замовлення"}
                </button>
                <p className="text-[11px] text-muted-foreground text-center">Менеджер передзвонить протягом 15 хвилин для підтвердження</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══ DESCRIPTION ═══ */}
      {landing.productDesc && (
        <section className="py-14 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-8">Детальніше про товар</h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{landing.productDesc}</div>
          </div>
        </section>
      )}

      {/* ═══ REVIEWS ═══ */}
      <section className="py-14 bg-[#F6F9FC]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="fill-amber-400 text-amber-400" />)}
            <span className="text-sm font-bold ml-1">5.0</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Що кажуть покупці</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/5 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B53A4] to-[#00B5D1] flex items-center justify-center text-white font-bold">{r.name?.[0] || "?"}</div>
                  <div>
                    <p className="font-bold text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.city}</p>
                  </div>
                  <div className="ml-auto flex">{[...Array(r.rating || 5)].map((_, j) => <Star key={j} size={12} className="fill-amber-400 text-amber-400" />)}</div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-14 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-8">Поширені запитання</h2>
          <div className="bg-white border border-black/5 rounded-2xl px-5">
            <FaqItem q="Як швидко відправляєте?" a="Відправляємо в день замовлення (якщо до 16:00) або наступного дня. Доставка Новою Поштою 1–3 дні." />
            <FaqItem q="Чи можна повернути товар?" a="Так, повернення протягом 14 днів без зайвих питань." />
            <FaqItem q="Яка гарантія?" a="Гарантія 12 місяців. У разі дефекту — заміна або повернення коштів." />
            <FaqItem q="Як оплатити?" a="Оплата при отриманні на відділенні Нової Пошти. Також можлива передоплата." />
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-14 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-black">Готові зробити замовлення?</h2>
          <p className="text-white/85 text-sm md:text-base">Залиште номер — і ми передзвонимо протягом 15 хвилин</p>
          <a href="#order" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#0B53A4] font-bold text-base rounded-xl hover:bg-white/95 active:scale-[0.98] transition-all shadow-lg">
            <ShoppingCart size={18} /> {landing.ctaText || "Замовити зараз"}
          </a>
        </div>
      </section>

      {/* ═══ STICKY MOBILE BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-black/10 px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-lg font-black">{price} ₴</div>
            {oldPrice && discountPercent > 0 && <div className="text-xs text-muted-foreground line-through">{oldPrice} ₴</div>}
          </div>
          <a href="#order" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-bold text-sm rounded-full active:scale-95 transition-all">
            <ShoppingCart size={16} /> {landing.ctaText || "Купити"}
          </a>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 bg-white border-t border-black/5 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black text-lg tracking-wider text-[#0B53A4]">OZO</span>
          <p className="text-[11px] text-muted-foreground tracking-wider">© {new Date().getFullYear()} OZO. Пн–Нд 08:00–21:00</p>
        </div>
      </footer>

    </div>
  )
}
