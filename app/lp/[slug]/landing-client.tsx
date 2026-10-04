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

/* ═══════════════════ Підсвітка іконок (емодзі / lucide) ═══════════════════ */
function Icon({ name, className = "" }: { name: string; className?: string }) {
  const emojis: Record<string, string> = {
    temp: "🌡️", drop: "💧", zap: "⚡", flame: "🔥", shield: "🛡️",
    egg: "🐣", duck: "🦆", turkey: "🦃", quail: "🐥", sprout: "🌱",
    money: "💰", wrench: "🔧", check: "✅", leaf: "🍃", heart: "❤️",
  }
  if (emojis[name]) return <span className={`leading-none ${className}`} style={{ fontSize: "1.35em" }}>{emojis[name]}</span>
  switch (name) {
    case "Truck": return <Truck className={className} />
    case "Shield": return <ShieldCheck className={className} />
    case "Star": return <Star className={className} />
    case "Flame": return <Flame className={className} />
    case "Check": return <Check className={className} />
    default: return <Check className={className} />
  }
}

/* ═══════════════════ Елемент FAQ ═══════════════════ */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/8 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-bold text-[#1A1A1A]">{q}</span>
        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${open ? "bg-[#FF7A00] text-white rotate-180" : "bg-black/5 text-[#1A1A1A]"}`}>
          <ChevronDown size={16} />
        </span>
      </button>
      <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="text-sm text-[#5B5B5B] leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════ MAIN ═══════════════════ */
export default function LandingClient({ landing }: { landing: any }) {
  // ── Дані (динамічні з БД + fallback під конкретний товар) ──
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

  const advantages: AdvantageType[] =
    Array.isArray(landing.advantages) && landing.advantages.length > 0
      ? landing.advantages
      : [
          { icon: "temp", title: "М'яке та рівномірне тепло", desc: "Нагрівається до оптимальних 38–40°C. Пташенята не кучкуються та не тиснуть одне одного." },
          { icon: "drop", title: "Вологозахист та простота догляду", desc: "Легко миється та дезінфікується. Не боїться посліду та випадково розлитої води." },
          { icon: "zap", title: "Економічна вигода", desc: "Окупається вже з першого виводку за рахунок збереження поголів'я та економії електроенергії." },
          { icon: "flame", title: "Пожежобезпечність", desc: "Вбудований захист від перегріву. Можна спокійно залишати увімкненим 24/7." },
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

  // ── Форма ──
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("+380")
  const [qty, setQty] = useState(1)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  // ── Карусель ──
  const [idx, setIdx] = useState(0)
  const touchX = useRef<number | null>(null)

  const qtyOptions = [
    { qty: 1, label: "1 шт", total: price, tag: "" },
    { qty: 2, label: "2 шт", total: Math.round(price * 2 * 0.9), tag: "Знижка -10%" },
    { qty: 3, label: "3 шт", total: price * 3, tag: "Доставка 0 грн" },
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
      try { w.ttq.track("PlaceAnOrder", { value: total, currency: "UAH", quantity: q, contents: [{ content_name: productName, quantity: q, price: price }] }) } catch {}
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

  // ViewContent при відкритті
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      try { (window as any).fbq("track", "ViewContent", { content_name: productName, value: price, currency: "UAH" }) } catch {}
    }
  }, [productName, price])

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1A1A1A] font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ozo-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,122,0,0.55); } 50% { box-shadow: 0 0 0 14px rgba(255,122,0,0); } }
        @keyframes ozo-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        @keyframes ozo-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      ` }} />

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 bg-[#F6F5F2]/95 backdrop-blur border-b border-black/5" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-3xl mx-auto h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FFB300] flex items-center justify-center text-white font-black text-sm">O</span>
            <span className="font-black text-lg tracking-wider">OZO</span>
          </div>
          <button onClick={scrollToOrder} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FFB300] text-white font-bold text-sm rounded-full active:scale-95 transition-all shadow-md">
            <ShoppingCart size={15} /> Замовити
          </button>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 pt-5 pb-8">
          {/* Badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-1.5 bg-white border border-black/5 shadow-sm rounded-full px-4 py-1.5 text-[12px] font-bold text-[#1A1A1A]">
              <span className="text-sm">🔥</span> Топ-продажів 2026
              <span className="text-black/20">|</span>
              <span className="text-[#FF7A00]">Гарантія 100% збереження молодняку</span>
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Текст */}
            <div className="space-y-4">
              <h1 className="text-[26px] leading-[1.15] md:text-[34px] font-black tracking-tight text-balance">
                {landing.title || "Збережіть 99% пташенят з перших днів життя з теплою підстилкою OZO Преміум"}
              </h1>
              <p className="text-[15px] md:text-base text-[#5B5B5B] leading-relaxed">
                {landing.subtitle || "Безпечне, рівномірне та економне інфрачервоне тепло. Пташенята не мерзнуть, не тиснуться та ростуть у 1.5 рази швидше."}
              </p>

              {/* Price block */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-[#FF7A00]">{price} ₴</span>
                  <span className="text-lg text-black/35 line-through">{oldPrice} ₴</span>
                  <span className="ml-auto bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">-{discountPercent}%</span>
                </div>
                <p className="text-[11px] text-black/40 mt-1">Стара ціна {oldPrice} грн → ціна сьогодні {price} грн (економія {Math.round((1 - price / oldPrice) * 100)}%)</p>
              </div>

              {/* Micro-benefits */}
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">⚡</span> Споживає всього 30 Вт — дешевше за звичайну лампочку</li>
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">🛡️</span> 100% захист від вологи, бруду та перегріву</li>
                <li className="flex items-center gap-2.5 text-[14px]"><span className="text-base">🐣</span> Підходить для курчат, каченят, індичат та перепелів</li>
              </ul>

              {/* CTA */}
              <button
                onClick={scrollToOrder}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#FF7A00] to-[#FFB300] text-white font-black text-[17px] rounded-2xl active:scale-[0.98] transition-transform"
                style={{ animation: "ozo-glow 2.2s ease-in-out infinite, ozo-pulse 2.2s ease-in-out infinite" }}
              >
                <ShoppingCart size={20} /> ШВИДКЕ ЗАМОВЛЕННЯ — ЗНИЖКА -30%
              </button>
            </div>

            {/* Image carousel */}
            <div className="order-first md:order-none">
              <div
                className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5"
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
                  <img
                    src={images[idx] || "/placeholder.jpg"}
                    alt={productName}
                    className="w-full h-full object-contain p-3"
                    draggable={false}
                  />
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Попереднє фото"
                      onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-95"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Наступне фото"
                      onClick={() => setIdx((i) => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-95"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, i) => (
                        <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-[#FF7A00]" : "w-1.5 bg-black/20"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px] text-black/50">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="font-bold text-black/70">4.9/5</span> — понад 2,500 задоволених птахівників
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BAR ═══ */}
      <section className="bg-white border-y border-black/5">
        <div className="max-w-3xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2.5"><Truck size={20} className="text-[#FF7A00] shrink-0" /><div><p className="text-[12px] font-bold leading-tight">Доставка 1–2 дні</p><p className="text-[11px] text-black/45">Нова Пошта</p></div></div>
          <div className="flex items-center gap-2.5"><CreditCard size={20} className="text-[#FF7A00] shrink-0" /><div><p className="text-[12px] font-bold leading-tight">Оплата при отриманні</p><p className="text-[11px] text-black/45">Огляд перед оплатою</p></div></div>
          <div className="flex items-center gap-2.5"><ShieldCheck size={20} className="text-[#FF7A00] shrink-0" /><div><p className="text-[12px] font-bold leading-tight">Гарантія 12 місяців</p><p className="text-[11px] text-black/45">Якість OZO</p></div></div>
          <div className="flex items-center gap-2.5"><Star size={20} className="text-[#FF7A00] shrink-0" /><div><p className="text-[12px] font-bold leading-tight">2,500+ покупців</p><p className="text-[11px] text-black/45">по всій Україні</p></div></div>
        </div>
      </section>

      {/* ═══ PROBLEM vs SOLUTION ═══ */}
      <section className="py-10 md:py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-center mb-6">Чому звичайні лампи вбивають ваше поголів'я?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-red-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><X size={16} /></span>
                <p className="font-bold text-[15px]">Звичайна ІЧ-лампа</p>
              </div>
              <ul className="space-y-2 text-[13px] text-[#5B5B5B]">
                <li>• Обпікає верхніх пташенят</li>
                <li>• Створює протяги та нерівномірне тепло</li>
                <li>• Сліпить очі та порушує сон</li>
                <li>• Споживає 250+ Вт</li>
                <li>• Часто вибухає від крапель води</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#FFFDF8] to-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={16} /></span>
                <p className="font-bold text-[15px] text-[#FF7A00]">Килимок OZO Преміум</p>
              </div>
              <ul className="space-y-2 text-[13px] text-[#1A1A1A]">
                <li>• Гріє знизу — природний обігрів, як під квочкою</li>
                <li>• Безпечний для очей</li>
                <li>• Повністю водонепроникний</li>
                <li>• Споживає лише 30 Вт</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-10 md:py-12 bg-white border-y border-black/5">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-center mb-6">Чому обирають OZO Преміум?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {advantages.map((a, i) => (
              <div key={i} className="rounded-2xl bg-[#F6F5F2] border border-black/5 p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF7A00] to-[#FFB300] flex items-center justify-center text-white shrink-0">
                  <Icon name={a.icon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[15px]">{a.title}</p>
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
              <div key={i} className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FF7A00] to-[#FFB300] flex items-center justify-center text-white font-black text-base">{r.name?.[0] || "?"}</div>
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ORDER FORM ═══ */}
      <section id="order" className="py-10 md:py-12 bg-white border-t border-black/5">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-3xl border border-black/8 shadow-xl p-6 md:p-8 bg-gradient-to-b from-white to-[#FFF8F0]">
            <h2 className="text-[22px] font-black text-center">Оформіть замовлення за 30 секунд</h2>
            <p className="text-[13px] text-[#5B5B5B] text-center mt-1 mb-5">
              Заповніть форму — ми зателефонуємо для уточнення деталей та відправимо сьогодні!
            </p>

            {done ? (
              <div className="text-center space-y-3 py-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check size={32} className="text-emerald-600" />
                </div>
                <p className="font-black text-xl">Дякуємо!</p>
                <p className="text-sm text-[#5B5B5B]">Замовлення прийнято. Менеджер передзвонить протягом 15 хвилин для підтвердження.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {/* Ім'я */}
                <div>
                  <label className="text-[12px] font-bold text-[#1A1A1A]">Ваше ім'я</label>
                  <div className="relative mt-1.5">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Наприклад, Андрій"
                      className="w-full h-13 py-3.5 pl-10 pr-3 rounded-xl border border-black/10 bg-white text-base outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all"
                    />
                  </div>
                </div>

                {/* Телефон */}
                <div>
                  <label className="text-[12px] font-bold text-[#1A1A1A]">Номер телефону <span className="text-red-500">*</span></label>
                  <div className="relative mt-1.5">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(maskPhoneInput(e.target.value).masked)}
                      placeholder="0XX XXX XX XX"
                      inputMode="tel"
                      required
                      className="w-full h-13 py-3.5 pl-10 pr-3 rounded-xl border border-black/10 bg-white text-base outline-none focus:ring-2 focus:ring-[#FF7A00] transition-all"
                    />
                  </div>
                </div>

                {/* Кількість */}
                <div>
                  <label className="text-[12px] font-bold text-[#1A1A1A]">Кількість</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {qtyOptions.map((o) => {
                      const active = o.qty === qty
                      return (
                        <button
                          type="button"
                          key={o.qty}
                          onClick={() => setQty(o.qty)}
                          className={`relative rounded-xl border-2 px-2 py-2.5 text-center transition-all ${active ? "border-[#FF7A00] bg-[#FFF3E6]" : "border-black/10 bg-white"}`}
                        >
                          <span className="block font-black text-[15px]">{o.label}</span>
                          <span className="block text-[12px] text-black/50">{o.total} ₴</span>
                          {o.tag && <span className={`block text-[10px] font-bold mt-0.5 ${o.qty === 3 ? "text-emerald-600" : "text-[#FF7A00]"}`}>{o.tag}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#FF7A00] to-[#FFB300] text-white font-black text-base rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  <Send size={17} />
                  {sending ? "Відправляємо..." : `ОФОРМИТИ ЗАМОВЛЕННЯ ЗІ ЗНИЖКОЮ — ${current.total} ₴`}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[12px] text-black/45 text-center">
                  <Lock size={13} /> Ваші дані в безпеці. Оплата здійснюється виключно при отриманні на пошті.
                </p>
              </form>
            )}
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
      <section className="py-12 bg-gradient-to-br from-[#FF7A00] to-[#FFB300] text-white">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-black">Збережіть своє поголів'я вже з першого дня</h2>
          <p className="text-white/90 text-[15px]">Залиште номер — і ми передзвонимо протягом 15 хвилин</p>
          <button
            onClick={scrollToOrder}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-[#FF7A00] font-black text-base rounded-2xl hover:bg-white/95 active:scale-[0.98] transition-transform shadow-xl"
          >
            <ShoppingCart size={18} /> ЗАМОВИТИ ЗІ ЗНИЖКОЮ -30%
          </button>
        </div>
      </section>

      {/* ═══ STICKY MOBILE BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-black/10 px-4 py-2.5" style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#FF7A00]">{current.total} ₴</span>
              {current.qty > 1 && <span className="text-[11px] text-black/40 line-through">{price * current.qty} ₴</span>}
            </div>
            {current.qty > 1 && <div className="text-[10px] font-bold text-emerald-600">{current.tag}</div>}
          </div>
          <button onClick={scrollToOrder} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#FF7A00] to-[#FFB300] text-white font-black text-sm rounded-full active:scale-95 transition-all" style={{ animation: "ozo-glow 2.2s ease-in-out infinite" }}>
            <ShoppingCart size={16} /> Замовити зараз
          </button>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-6 bg-[#F6F5F2] border-t border-black/5 pb-24 md:pb-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-black tracking-wider">OZO</span>
          <p className="text-[11px] text-black/40">© {new Date().getFullYear()} OZO. Пн–Нд 08:00–21:00</p>
        </div>
      </footer>
    </div>
  )
}
