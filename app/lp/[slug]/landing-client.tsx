"use client"

import { useEffect, useRef, useState } from "react"
import {
  Star, Truck, CreditCard, ShieldCheck, Check, ChevronDown,
  ChevronLeft, ChevronRight, Phone, User, ShoppingCart, Send, Lock, X, Flame, BadgeCheck,
} from "lucide-react"
import { toast } from "sonner"
import { maskPhoneInput, stripPhoneFormatting, isValidPhone } from "@/lib/phone-format"

type ReviewType = { name: string; city: string; text: string; rating: number }
type AdvantageType = { icon: string; title: string; desc: string }

/* ═══════════════════ Іконки (емодзі / lucide) ═══════════════════ */
function Icon({ name, className = "" }: { name: string; className?: string }) {
  const emojis: Record<string, string> = {
    temp: "🌡️", drop: "💧", zap: "⚡", flame: "🔥", shield: "🛡️",
    egg: "🐣", duck: "🦆", turkey: "🦃", quail: "🐥", sprout: "🌱",
    money: "💰", wrench: "🔧", check: "✅", leaf: "🍃", heart: "❤️",
  }
  if (emojis[name]) return <span className={`leading-none ${className}`} style={{ fontSize: "1.4em" }}>{emojis[name]}</span>
  switch (name) {
    case "Truck": return <Truck className={className} />
    case "Shield": return <ShieldCheck className={className} />
    case "Star": return <Star className={className} />
    case "Flame": return <Flame className={className} />
    case "Check": return <Check className={className} />
    default: return <Check className={className} />
  }
}

/* ═══════════════════ Зворотний відлік до кінця доби ═══════════════════ */
function useCountdown() {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      setLeft(Math.max(0, end.getTime() - now.getTime()))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  const total = Math.floor(left / 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return { h: pad(Math.floor(total / 3600)), m: pad(Math.floor((total % 3600) / 60)), s: pad(total % 60) }
}

function Countdown({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  const { h, m, s } = useCountdown()
  const box = onDark
    ? "inline-flex items-center justify-center rounded-md bg-white text-[#FF2D00] font-black tabular-nums"
    : "inline-flex items-center justify-center rounded-lg bg-[#1A1A1A] text-white font-black tabular-nums"
  const sep = <span className={`font-black mx-0.5 ${onDark ? "text-white" : "text-[#1A1A1A]"}`}>:</span>
  if (compact) {
    const size = onDark ? "w-8 h-8 text-[14px]" : "w-7 h-7 text-[13px]"
    return (
      <span className="inline-flex items-center gap-0.5">
        <span className={`${box} ${size}`}>{h}</span>{sep}
        <span className={`${box} ${size}`}>{m}</span>{sep}
        <span className={`${box} ${size}`}>{s}</span>
      </span>
    )
  }
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="flex flex-col items-center"><span className={`${box} w-12 h-12 text-xl`}>{h}</span><span className={`text-[10px] mt-1 uppercase tracking-wider ${onDark ? "text-white/80" : "text-black/40"}`}>год</span></div>
      {sep}
      <div className="flex flex-col items-center"><span className={`${box} w-12 h-12 text-xl`}>{m}</span><span className={`text-[10px] mt-1 uppercase tracking-wider ${onDark ? "text-white/80" : "text-black/40"}`}>хв</span></div>
      {sep}
      <div className="flex flex-col items-center"><span className={`${box} w-12 h-12 text-xl`}>{s}</span><span className={`text-[10px] mt-1 uppercase tracking-wider ${onDark ? "text-white/80" : "text-black/40"}`}>сек</span></div>
    </div>
  )
}

/* ═══════════════════ FAQ ═══════════════════ */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/8 last:border-0">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 py-4 text-left" aria-expanded={open}>
        <span className="text-[15px] font-bold text-[#1A1A1A]">{q}</span>
        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${open ? "bg-[#FF6B00] text-white rotate-180" : "bg-black/5 text-[#1A1A1A]"}`}>
          <ChevronDown size={16} />
        </span>
      </button>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden"><p className="text-sm text-[#5B5B5B] leading-relaxed">{a}</p></div>
      </div>
    </div>
  )
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function LandingClient({ landing }: { landing: any }) {
  const images: string[] =
    Array.isArray(landing.productImages) && landing.productImages.length > 0
      ? landing.productImages
      : landing.productImage
        ? [landing.productImage]
        : []
  const price = Number(landing.productPrice) || 599
  const oldPrice = Number(landing.productOldPrice) || 850
  const discountPercent = landing.discountPercent != null ? Number(landing.discountPercent) : 30
  const productName = landing.productName || "Килимок OZO Преміум"
  const savings = oldPrice - price

  const advantages: AdvantageType[] =
    Array.isArray(landing.advantages) && landing.advantages.length > 0
      ? landing.advantages
      : [
          { icon: "zap", title: "30 Вт економії", desc: "Споживає менше за звичайну лампочку — рахунок за світло в рази менший." },
          { icon: "temp", title: "Ідеальна температура 38–40°C", desc: "Пташенята не кучкуються, не мерзнуть та ростуть швидше." },
          { icon: "drop", title: "Вологозахищений", desc: "Не боїться води, посліду та легко миється." },
          { icon: "shield", title: "100% безпека", desc: "Вбудований захист від перегріву — працює 24/7 без нагляду." },
        ]

  const reviews: ReviewType[] =
    Array.isArray(landing.reviews) && landing.reviews.length > 0
      ? landing.reviews
      : [
          { name: "Іван", city: "Полтавська обл.", text: "Курчата перестали гинути, як тільки поставив килимок замість лампи. Гріє рівномірно, малята спокійно сплять і не тиснуться. Дуже задоволений!", rating: 5 },
          { name: "Олена", city: "Київська обл.", text: "Значна економія на світлі — лічильник майже не крутиться. Виводок вижив повністю, 100%. Рекомендую кожному птахівнику!", rating: 5 },
          { name: "Сергій", city: "Хмельницька обл.", text: "Швидка доставка — прийшло за 2 дні Новою Поштою. Килимок якісний, вологи не боїться. Вже другу зиму працює без нарікань.", rating: 5 },
          { name: "Марія", city: "Вінницька обл.", text: "Замовила 3 шт для індичат. Окупилося з першого виводку. Пташенята ростуть активними, без перегріву. Дякую за консультацію!", rating: 5 },
        ]

  // Форма
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("+380")
  const [qty, setQty] = useState(1)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  // Карусель
  const [idx, setIdx] = useState(0)
  const touchX = useRef<number | null>(null)

  const qtyOptions = [
    { qty: 1, label: "1 шт", total: price },
    { qty: 2, label: "2 шт", total: price * 2 },
    { qty: 3, label: "3 шт", total: price * 3 },
  ]
  const current = qtyOptions.find((o) => o.qty === qty) || qtyOptions[0]

  function scrollToOrder(e?: React.MouseEvent) {
    e?.preventDefault()
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function firePixels(total: number, q: number) {
    if (typeof window === "undefined") return
    const w = window as any
    const payload = { content_name: productName, value: total, currency: "UAH", num_items: q }
    if (w.fbq) {
      try { w.fbq("track", "Lead", payload) } catch {}
      try { w.fbq("track", "Purchase", { value: total, currency: "UAH", content_name: productName }) } catch {}
    }
    if (w.ttq) {
      try { w.ttq.track("CompleteRegistration", payload) } catch {}
      try { w.ttq.track("PlaceAnOrder", { value: total, currency: "UAH", quantity: q, contents: [{ content_name: productName, quantity: q, price }] }) } catch {}
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidPhone(phone)) {
      toast.error("Введіть повний номер телефону")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/checkout/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          price: current.total,
          qty,
          slug: landing.slug,
          name: name.trim(),
          phone: stripPhoneFormatting(phone),
        }),
      })
      if (res.ok) {
        setDone(true)
        firePixels(current.total, qty)
        toast.success("Замовлення прийнято! Очікуйте дзвінка менеджера.")
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "Помилка, спробуйте ще раз")
      }
    } catch {
      toast.error("Мережева помилка")
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      try { (window as any).fbq("track", "ViewContent", { content_name: productName, value: price, currency: "UAH" }) } catch {}
    }
  }, [productName, price])

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#1A1A1A] font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ozo-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,0,0.55); } 50% { box-shadow: 0 0 0 16px rgba(255,107,0,0); } }
        @keyframes ozo-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes ozo-shine { 0% { transform: translateX(-150%) skewX(-20deg); } 60%,100% { transform: translateX(350%) skewX(-20deg); } }
      ` }} />

      {/* ═══ TOP URGENCY BANNER (з таймером) ═══ */}
      <div className="bg-gradient-to-r from-[#FF2D00] via-[#FF5A00] to-[#FF8A00] text-white px-3 py-2.5" style={{ paddingTop: "max(10px, env(safe-area-inset-top))" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 flex-wrap">
          <span className="text-[13px] md:text-[15px] font-black uppercase tracking-wide text-center">🔥 Супер акція! Знижка −30% діє тільки сьогодні!</span>
          <Countdown compact onDark />
        </div>
      </div>

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 bg-[#F7F6F3]/95 backdrop-blur border-b border-black/5">
        <div className="max-w-3xl mx-auto h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB300] flex items-center justify-center text-white font-black text-sm shadow-sm">O</span>
            <span className="font-black text-lg tracking-wider">OZO</span>
          </div>
          <button onClick={scrollToOrder} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-[#FFB300] text-white font-bold text-sm rounded-full active:scale-95 transition-all shadow-md">
            <ShoppingCart size={15} /> Замовити
          </button>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-6">
          {/* Product title badge */}
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 bg-[#1A1A1A] text-white text-[12px] font-bold px-3.5 py-1.5 rounded-full shadow-sm">🏷️ {productName}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Текст */}
            <div className="space-y-4">
              <h1 className="text-[26px] leading-[1.1] md:text-[34px] font-black tracking-tight uppercase text-balance">
                {landing.title || "Збережіть 99% молодняку з перших днів життя!"}
              </h1>
              <p className="text-[15px] md:text-base text-[#4A4A4A] leading-relaxed">
                {landing.subtitle || "Безпечне, рівномірне та економне інфрачервоне тепло. Пташенята не мерзнуть, не тиснуться та ростуть у 1.5 рази швидше."}
              </p>

              {/* Price card */}
              <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5">
                <div className="flex items-center gap-3">
                  <span className="text-[15px] text-black/40 line-through">{oldPrice} грн</span>
                  <span className="bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-md">−{discountPercent}%</span>
                </div>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-5xl font-black text-[#FF2D00] leading-none">{price} грн</span>
                </div>
                <p className="text-[12px] text-emerald-600 font-bold mt-2">Ви економите {savings} грн сьогодні</p>
              </div>

              {/* Micro-benefits */}
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">⚡</span> Всього 30 Вт — рахунок за світло в 8 разів менший</li>
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">🛡️</span> 100% захист від вологи, бруду та перегріву</li>
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">🐣</span> Курчата, каченята, індичата та перепели</li>
              </ul>

              {/* CTA */}
              <button
                onClick={scrollToOrder}
                className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#FF2D00] to-[#FF8A00] text-white font-black text-[17px] rounded-2xl active:scale-[0.98] transition-transform"
                style={{ animation: "ozo-glow 2.2s ease-in-out infinite, ozo-pulse 2.2s ease-in-out infinite" }}
              >
                <span className="relative z-10 flex items-center gap-2"><ShoppingCart size={20} /> ЗАМОВИТИ ЗІ ЗНИЖКОЮ</span>
                <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: "ozo-shine 3s ease-in-out infinite" }} />
              </button>

              {/* Trust chips */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-black/60">
                <span className="flex items-center gap-1"><Truck size={13} className="text-[#FF6B00]" /> Доставка 1–2 дні</span>
                <span className="flex items-center gap-1"><CreditCard size={13} className="text-[#FF6B00]" /> Оплата при отриманні</span>
              </div>
            </div>

            {/* Галерея */}
            <div className="order-first md:order-none">
              <div
                className="relative bg-white rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-black/5"
                onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchX.current == null || images.length < 2) return
                  const dx = e.changedTouches[0].clientX - touchX.current
                  if (dx < -40) setIdx((i) => (i + 1) % images.length)
                  if (dx > 40) setIdx((i) => (i - 1 + images.length) % images.length)
                  touchX.current = null
                }}
              >
                <div className="aspect-square">
                  <img src={images[idx] || "/placeholder.jpg"} alt={productName} className="w-full h-full object-contain p-3" draggable={false} />
                </div>
                {images.length > 1 && (
                  <>
                    <button type="button" aria-label="Попереднє фото" onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-95"><ChevronLeft size={18} /></button>
                    <button type="button" aria-label="Наступне фото" onClick={() => setIdx((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-95"><ChevronRight size={18} /></button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-[#FF6B00]" : "w-1.5 bg-black/20"}`} />)}
                    </div>
                  </>
                )}
                <span className="absolute top-3 left-3 bg-[#FF2D00] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow">−30%</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px] text-black/50">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-black/70">4.9/5</span> — понад 2,500 задоволених птахівників
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EXPRESS ORDER FORM (одразу під hero) ═══ */}
      <section id="order" className="py-8 bg-white border-y border-black/5">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-3xl border-2 border-[#FF6B00] shadow-[0_20px_60px_rgba(255,107,0,0.18)] p-6 md:p-8 bg-gradient-to-b from-white to-[#FFF6EC]">
            <h2 className="text-[22px] font-black text-center uppercase">Оформіть замовлення за 30 секунд</h2>
            <p className="text-[13px] text-[#5B5B5B] text-center mt-1">Зателефонуємо для підтвердження та відправимо сьогодні</p>

            {done ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center"><Check size={32} className="text-emerald-600" /></div>
                <p className="font-black text-xl">Дякуємо!</p>
                <p className="text-sm text-[#5B5B5B]">Замовлення прийнято. Менеджер передзвонить протягом 15 хвилин для підтвердження.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 mt-5">
                <div>
                  <label className="text-[12px] font-bold text-[#1A1A1A]">Ваше ім'я</label>
                  <div className="relative mt-1.5">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35" />
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Наприклад, Андрій" className="w-full h-13 py-3.5 pl-10 pr-3 rounded-xl border border-black/10 bg-white text-base outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#1A1A1A]">Телефон <span className="text-red-500">*</span></label>
                  <div className="relative mt-1.5">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35" />
                    <input value={phone} onChange={(e) => setPhone(maskPhoneInput(e.target.value).masked)} placeholder="0XX XXX XX XX" inputMode="tel" required className="w-full h-13 py-3.5 pl-10 pr-3 rounded-xl border border-black/10 bg-white text-base outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#1A1A1A]">Кількість</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {qtyOptions.map((o) => {
                      const active = o.qty === qty
                      return (
                        <button type="button" key={o.qty} onClick={() => setQty(o.qty)} className={`relative rounded-xl border-2 px-2 py-2.5 text-center transition-all ${active ? "border-[#FF6B00] bg-[#FFF3E6] shadow-md" : "border-black/10 bg-white"}`}>
                          <span className="block font-black text-[15px]">{o.label}</span>
                          <span className="block text-[12px] text-black/50">{o.total} ₴</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button type="submit" disabled={sending} className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#FF2D00] to-[#FF8A00] text-white font-black text-base rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60" style={{ animation: "ozo-glow 2.2s ease-in-out infinite" }}>
                  <span className="relative z-10 flex items-center gap-2"><Send size={17} />{sending ? "Відправляємо..." : `ЗАМОВИТИ ЗІ ЗНИЖКОЮ — ${current.total} ₴`}</span>
                  <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: "ozo-shine 3s ease-in-out infinite" }} />
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[12px] text-black/45 text-center">
                  <Lock size={13} /> Ваші дані в безпеці. Оплата виключно при отриманні на пошті.
                </p>
                <p className="flex items-center justify-center gap-3 text-[11px] text-black/50">
                  <span className="flex items-center gap-1"><Truck size={12} /> Доставка 1–2 дні</span>
                  <span className="flex items-center gap-1"><CreditCard size={12} /> Оплата при отриманні</span>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══ VALUE PROPOSITION ═══ */}
      <section className="py-10 md:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-center mb-6">Чому OZO Преміум — це вигідно?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {advantages.map((a, i) => (
              <div key={i} className="rounded-2xl bg-white border border-black/5 p-5 flex items-start gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FFB300] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Icon name={a.icon} className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-[15px]">{a.title}</p>
                  <p className="text-[13px] text-[#5B5B5B] mt-1 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON (Так / Ні) ═══ */}
      <section className="py-10 md:py-12 bg-white border-y border-black/5">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-center mb-6">OZO Преміум vs звичайна лампа</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* NO */}
            <div className="rounded-2xl border border-red-100 bg-white overflow-hidden shadow-sm">
              <div className="bg-red-500 text-white px-4 py-2.5 flex items-center gap-2 font-black text-[14px]">
                <X size={16} /> НІ — звичайна ІЧ-лампа
              </div>
              <ul className="space-y-2 text-[13px] text-[#5B5B5B] p-5">
                <li>• Обпікає верхніх пташенят</li>
                <li>• Протяги та нерівномірне тепло</li>
                <li>• Сліпить очі, порушує сон</li>
                <li>• Споживає 250+ Вт</li>
                <li>• Вибухає від крапель води</li>
              </ul>
            </div>
            {/* YES */}
            <div className="rounded-2xl border-2 border-emerald-400 overflow-hidden shadow-[0_10px_30px_rgba(16,185,129,0.15)]">
              <div className="bg-emerald-500 text-white px-4 py-2.5 flex items-center gap-2 font-black text-[14px]">
                <Check size={16} /> ТАК — Килимок OZO Преміум
              </div>
              <ul className="space-y-2 text-[13px] text-[#1A1A1A] p-5 bg-gradient-to-br from-[#F0FDF4] to-white">
                <li>• Гріє знизу — як під квочкою</li>
                <li>• Безпечний для очей</li>
                <li>• Повністю водонепроникний</li>
                <li>• Лише 30 Вт</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section className="py-10 md:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={18} className="fill-amber-400 text-amber-400" />)}
            <span className="font-black ml-1">4.9</span>
            <span className="text-[13px] text-black/50">/ 5.0</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-center mb-6">Відгуки реальних покупців</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FFB300] flex items-center justify-center text-white font-black text-lg shrink-0">{r.name?.[0] || "?"}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-[14px] truncate">{r.name}</p>
                      <BadgeCheck size={15} className="text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[12px] text-black/45">{r.city}</p>
                  </div>
                  <div className="ml-auto flex shrink-0">
                    {[...Array(r.rating || 5)].map((_, j) => <Star key={j} size={13} className="fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
                <p className="text-[13px] text-[#3A3A3A] leading-relaxed">{r.text}</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-2">✓ Покупку підтверджено</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-10 md:py-12 bg-white border-t border-black/5">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-center mb-6">Поширені запитання</h2>
          <div className="bg-white rounded-2xl border border-black/8 px-5 py-1 shadow-sm">
            <FaqItem q="Як правильно використовувати килимок?" a="Покладіть килимок на дно брудера або ящика, зверху — суху підстилку (стружка, папір). Підключіть до мережі та відрегулюйте температуру. Пташенята самі виберуть комфортну зону — частина спить на теплому, частина — на прохолодному." />
            <FaqItem q="Чи безпечно залишати його на ніч?" a="Так. Вбудований захист від перегріву автоматично підтримує безпечну температуру 38–40°C. Килимок розрахований на роботу 24/7 і не боїться вологи." />
            <FaqItem q="Яка гарантія та умови повернення?" a="Гарантія — 12 місяців. Якщо виявили дефект — замінимо або повернемо кошти. Також діє повернення протягом 14 днів без пояснення причини." />
            <FaqItem q="Як швидко здійснюється доставка?" a="Відправляємо Новою Поштою в день замовлення (якщо до 16:00). Доставка по Україні — 1–2 дні. Оплата при отриманні." />
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-12 bg-gradient-to-br from-[#FF2D00] to-[#FF8A00] text-white">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase">Збережіть своє поголів'я вже з першого дня</h2>
          <p className="text-white/90 text-[15px]">Залиште номер — і ми передзвонимо протягом 15 хвилин</p>
          <button onClick={scrollToOrder} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#FF2D00] font-black text-base rounded-2xl hover:bg-white/95 active:scale-[0.98] transition-transform shadow-xl">
            <ShoppingCart size={18} /> КУПИТИ ЗІ ЗНИЖКОЮ
          </button>
          <p className="flex items-center justify-center gap-2 text-[12px] text-white/85"><CreditCard size={14} /> Оплата при отриманні • Без передоплати</p>
        </div>
      </section>

      {/* ═══ STICKY MOBILE FOOTER ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-black/10 px-4 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]" style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-black/45 font-bold uppercase tracking-wide">Ціна</div>
            <div className="text-2xl font-black text-[#FF2D00] leading-none">{current.total} грн</div>
          </div>
          <button onClick={scrollToOrder} className="relative overflow-hidden flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#FF2D00] to-[#FF8A00] text-white font-black text-[15px] rounded-full active:scale-95 transition-all" style={{ animation: "ozo-glow 2.2s ease-in-out infinite" }}>
            <span className="relative z-10 flex items-center gap-2"><ShoppingCart size={17} /> КУПИТИ ЗІ ЗНИЖКОЮ</span>
            <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: "ozo-shine 3s ease-in-out infinite" }} />
          </button>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-6 bg-[#F7F6F3] border-t border-black/5 pb-28 md:pb-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-black tracking-wider">OZO</span>
          <p className="text-[11px] text-black/40">© {new Date().getFullYear()} OZO. Пн–Нд 08:00–21:00</p>
        </div>
      </footer>
    </div>
  )
}
