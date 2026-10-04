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

function Countdown({ compact = false }: { compact?: boolean }) {
  const { h, m, s } = useCountdown()
  const box = "inline-flex items-center justify-center rounded-lg bg-[#1A1A1A] text-white font-black tabular-nums"
  const sep = <span className="font-black text-[#1A1A1A] mx-0.5">:</span>
  if (compact) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <span className={`${box} w-7 h-7 text-[13px]`}>{h}</span>{sep}
        <span className={`${box} w-7 h-7 text-[13px]`}>{m}</span>{sep}
        <span className={`${box} w-7 h-7 text-[13px]`}>{s}</span>
      </span>
    )
  }
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="flex flex-col items-center"><span className={`${box} w-12 h-12 text-xl`}>{h}</span><span className="text-[10px] text-black/40 mt-1 uppercase tracking-wider">год</span></div>
      {sep}
      <div className="flex flex-col items-center"><span className={`${box} w-12 h-12 text-xl`}>{m}</span><span className="text-[10px] text-black/40 mt-1 uppercase tracking-wider">хв</span></div>
      {sep}
      <div className="flex flex-col items-center"><span className={`${box} w-12 h-12 text-xl`}>{s}</span><span className="text-[10px] text-black/40 mt-1 uppercase tracking-wider">сек</span></div>
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
          { icon: "temp", title: "Живе тепло, як під квочкою", desc: "Рівномірні 38–40°C знизу — 0% замерзлих пташенят і спокійний сон без кучкування." },
          { icon: "drop", title: "Не боїться води та бруду", desc: "Герметична плівка. Легко миється та дезінфікується — гігієна без зайвих зусиль." },
          { icon: "zap", title: "Економія до 8 разів", desc: "Всього 30 Вт. Окупається вже з першого виводку за рахунок збереження поголів'я." },
          { icon: "flame", title: "Безпека 24/7", desc: "Вбудований захист від перегріву. Працює цілодобово без вашого постійного нагляду." },
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

      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <div className="bg-gradient-to-r from-[#FF4D00] to-[#FF8A00] text-white text-center text-[12px] font-bold py-1.5 px-3" style={{ paddingTop: "max(6px, env(safe-area-inset-top))" }}>
        🚚 Оплата при отриманні • Доставка 1–2 дні • Сьогодні −30%
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
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-8">
          {/* Badge */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 bg-white border border-black/5 shadow-sm rounded-full px-3.5 py-1.5 text-[12px] font-bold">
              <span className="text-sm">🔥</span> ХІТ ПРОДАЖІВ 2026
            </span>
            <span className="inline-flex items-center gap-1 bg-red-500 text-white shadow-sm rounded-full px-3.5 py-1.5 text-[12px] font-bold">
              АКЦІЯ −30%
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Текст */}
            <div className="space-y-4">
              <h1 className="text-[26px] leading-[1.15] md:text-[34px] font-black tracking-tight text-balance">
                {landing.title || "Збережіть 99% пташенят з перших днів життя з теплою підстилкою OZO Преміум"}
              </h1>
              <p className="text-[15px] md:text-base text-[#4A4A4A] leading-relaxed">
                {landing.subtitle || "Безпечне, рівномірне та економне інфрачервоне тепло. Пташенята не мерзнуть, не тиснуться та ростуть у 1.5 рази швидше."}
              </p>

              {/* Ціна + економія */}
              <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-[#FF4D00] leading-none">{price} ₴</span>
                  <span className="text-lg text-black/35 line-through">{oldPrice} ₴</span>
                  <span className="ml-auto bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">−{discountPercent}%</span>
                </div>
                <p className="text-[12px] text-emerald-600 font-bold mt-2">Ви економите {savings} грн сьогодні</p>
              </div>

              {/* Мікропереваги */}
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">⚡</span> Всього 30 Вт — рахунок за світло в 8 разів менший</li>
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">🛡️</span> 100% захист від вологи, бруду та перегріву</li>
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">🐣</span> Курчата, каченята, індичата та перепели</li>
              </ul>

              {/* CTA */}
              <button
                onClick={scrollToOrder}
                className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#FF4D00] to-[#FF8A00] text-white font-black text-[17px] rounded-2xl active:scale-[0.98] transition-transform"
                style={{ animation: "ozo-glow 2.2s ease-in-out infinite, ozo-pulse 2.2s ease-in-out infinite" }}
              >
                <span className="relative z-10 flex items-center gap-2"><ShoppingCart size={20} /> ШВИДКЕ ЗАМОВЛЕННЯ — ЗНИЖКА −30%</span>
                <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: "ozo-shine 3s ease-in-out infinite" }} />
              </button>

              {/* Trust chips під CTA */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] text-black/60">
                <span className="flex items-center gap-1"><CreditCard size={13} className="text-[#FF6B00]" /> Оплата при отриманні</span>
                <span className="flex items-center gap-1"><Truck size={13} className="text-[#FF6B00]" /> Відправка сьогодні</span>
              </div>
            </div>

            {/* Карусель */}
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
                <span className="absolute top-3 left-3 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur">−30% АКЦІЯ</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px] text-black/50">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-black/70">4.9/5</span> — понад 2,500 задоволених птахівників
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COUNTDOWN STRIP ═══ */}
      <section className="bg-white border-y border-black/5">
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col items-center gap-3">
          <p className="text-[15px] font-black text-center">⏳ До кінця акції −30% залишилось:</p>
          <Countdown />
          <p className="text-[12px] text-black/45">За акційною ціною залишилось <b className="text-[#FF4D00]">12 шт</b></p>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="bg-[#F7F6F3]">
        <div className="max-w-3xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2.5 bg-white rounded-xl p-3 shadow-sm"><Truck size={20} className="text-[#FF6B00] shrink-0" /><div><p className="text-[12px] font-bold leading-tight">Доставка 1–2 дні</p><p className="text-[11px] text-black/45">Нова Пошта</p></div></div>
          <div className="flex items-center gap-2.5 bg-white rounded-xl p-3 shadow-sm"><CreditCard size={20} className="text-[#FF6B00] shrink-0" /><div><p className="text-[12px] font-bold leading-tight">Оплата при отриманні</p><p className="text-[11px] text-black/45">Огляд перед оплатою</p></div></div>
          <div className="flex items-center gap-2.5 bg-white rounded-xl p-3 shadow-sm"><ShieldCheck size={20} className="text-[#FF6B00] shrink-0" /><div><p className="text-[12px] font-bold leading-tight">Гарантія 12 місяців</p><p className="text-[11px] text-black/45">Якість OZO</p></div></div>
          <div className="flex items-center gap-2.5 bg-white rounded-xl p-3 shadow-sm"><Star size={20} className="text-[#FF6B00] shrink-0" /><div><p className="text-[12px] font-bold leading-tight">2,500+ покупців</p><p className="text-[11px] text-black/45">по всій Україні</p></div></div>
        </div>
      </section>

      {/* ═══ PROBLEM vs SOLUTION ═══ */}
      <section className="py-10 md:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-center mb-2">Чому звичайні лампи вбивають ваше поголів'я?</h2>
          <p className="text-center text-[13px] text-black/50 mb-6">Порівняйте самі — і ви зрозумієте, що обирають розумні птахівники</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><X size={16} /></span>
                <p className="font-bold text-[15px]">Звичайна ІЧ-лампа</p>
              </div>
              <ul className="space-y-2 text-[13px] text-[#5B5B5B]">
                <li>• Обпікає верхніх пташенят</li>
                <li>• Протяги та нерівномірне тепло</li>
                <li>• Сліпить очі, порушує сон</li>
                <li>• Споживає 250+ Вт</li>
                <li>• Вибухає від крапель води</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-[#FF6B00] bg-gradient-to-br from-[#FFF6EC] to-white p-5 shadow-[0_10px_30px_rgba(255,107,0,0.12)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={16} /></span>
                <p className="font-bold text-[15px] text-[#FF6B00]">Килимок OZO Преміум</p>
              </div>
              <ul className="space-y-2 text-[13px] text-[#1A1A1A]">
                <li>• Гріє знизу — як під квочкою</li>
                <li>• Безпечний для очей</li>
                <li>• Повністю водонепроникний</li>
                <li>• Лише 30 Вт</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BENEFITS ═══ */}
      <section className="py-10 md:py-12 bg-white border-y border-black/5">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-center mb-2">Чому OZO Преміум — це вигідно?</h2>
          <p className="text-center text-[13px] text-black/50 mb-6">Кожна деталь працює на результат: збереження поголів'я та ваш спокій</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {advantages.map((a, i) => (
              <div key={i} className="rounded-2xl bg-[#F7F6F3] border border-black/5 p-5 flex items-start gap-4 shadow-sm">
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
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FFB300] flex items-center justify-center text-white font-black text-base">{r.name?.[0] || "?"}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-[14px] truncate">{r.name}</p>
                      <BadgeCheck size={15} className="text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[12px] text-black/45">{r.city}</p>
                  </div>
                  <div className="ml-auto flex shrink-0">
                    {[...Array(r.rating || 5)].map((_, j) => <Star key={j} size={12} className="fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
                <p className="text-[13px] text-[#3A3A3A] leading-relaxed">{r.text}</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-2">✓ Покупку підтверджено</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ORDER FORM ═══ */}
      <section id="order" className="py-10 md:py-12 bg-white border-t border-black/5">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-3xl border border-black/8 shadow-[0_20px_60px_rgba(0,0,0,0.10)] p-6 md:p-8 bg-gradient-to-b from-white to-[#FFF6EC]">
            <h2 className="text-[22px] font-black text-center">Оформіть замовлення за 30 секунд</h2>
            <p className="text-[13px] text-[#5B5B5B] text-center mt-1">Зателефонуємо для підтвердження та відправимо сьогодні</p>

            {/* Urgency всередині форми */}
            <div className="flex items-center justify-center gap-3 mt-4 mb-5 bg-[#FFF3E6] border border-[#FFD9B3] rounded-xl py-2.5 px-3">
              <span className="text-[12px] font-bold text-[#1A1A1A]">Акція закінчується через:</span>
              <Countdown compact />
            </div>

            {done ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center"><Check size={32} className="text-emerald-600" /></div>
                <p className="font-black text-xl">Дякуємо!</p>
                <p className="text-sm text-[#5B5B5B]">Замовлення прийнято. Менеджер передзвонить протягом 15 хвилин для підтвердження.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-[12px] font-bold text-[#1A1A1A]">Ваше ім'я</label>
                  <div className="relative mt-1.5">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35" />
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Наприклад, Андрій" className="w-full h-13 py-3.5 pl-10 pr-3 rounded-xl border border-black/10 bg-white text-base outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#1A1A1A]">Номер телефону <span className="text-red-500">*</span></label>
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

                <button type="submit" disabled={sending} className="relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#FF4D00] to-[#FF8A00] text-white font-black text-base rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60" style={{ animation: "ozo-glow 2.2s ease-in-out infinite" }}>
                  <span className="relative z-10 flex items-center gap-2"><Send size={17} />{sending ? "Відправляємо..." : `ОФОРМИТИ ЗАМОВЛЕННЯ — ${current.total} ₴`}</span>
                  <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ animation: "ozo-shine 3s ease-in-out infinite" }} />
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[12px] text-black/45 text-center">
                  <Lock size={13} /> Ваші дані в безпеці. Оплата виключно при отриманні на пошті.
                </p>
              </form>
            )}
          </div>

          {/* Stock bar під формою */}
          <div className="mt-4 bg-white rounded-2xl border border-black/8 p-4 shadow-sm">
            <div className="flex justify-between items-center text-[12px] font-bold mb-1.5">
              <span>🔥 За акційною ціною залишилось: <span className="text-[#FF4D00]">12 шт</span></span>
              <span className="text-black/45">87% розібрано</span>
            </div>
            <div className="h-2.5 bg-black/8 rounded-full overflow-hidden">
              <div className="h-full w-[87%] bg-gradient-to-r from-[#FF4D00] to-[#FF8A00] rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-10 md:py-12">
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
      <section className="py-12 bg-gradient-to-br from-[#FF4D00] to-[#FF8A00] text-white">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-black">Збережіть своє поголів'я вже з першого дня</h2>
          <p className="text-white/90 text-[15px]">Залиште номер — і ми передзвонимо протягом 15 хвилин</p>
          <button onClick={scrollToOrder} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#FF4D00] font-black text-base rounded-2xl hover:bg-white/95 active:scale-[0.98] transition-transform shadow-xl">
            <ShoppingCart size={18} /> ЗАМОВИТИ ЗІ ЗНИЖКОЮ −30%
          </button>
          <p className="flex items-center justify-center gap-2 text-[12px] text-white/85"><CreditCard size={14} /> Оплата при отриманні • Без передоплати</p>
        </div>
      </section>

      {/* ═══ STICKY MOBILE BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-black/10 px-4 py-2.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]" style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#FF4D00]">{current.total} ₴</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/50 mt-0.5">
              <span className="text-[#FF4D00]">⏳</span> Акція: <Countdown compact />
            </div>
          </div>
          <button onClick={scrollToOrder} className="relative overflow-hidden flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FF4D00] to-[#FF8A00] text-white font-black text-sm rounded-full active:scale-95 transition-all" style={{ animation: "ozo-glow 2.2s ease-in-out infinite" }}>
            <span className="relative z-10 flex items-center gap-2"><ShoppingCart size={16} /> Замовити зараз</span>
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
