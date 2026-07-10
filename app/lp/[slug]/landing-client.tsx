"use client"

import { useState, useEffect, useRef } from "react"
import { Star, ChevronDown, ChevronUp, X, ShoppingCart, Phone, User, Send, Shield, Truck, RotateCcw, Check, Scissors, Sprout, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { maskPhoneInput, stripPhoneFormatting, isValidPhone } from "@/lib/phone-format"

/* ── Timer ── */
function CountdownTimer({ endTime }: { endTime: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv) }, [])
  const left = Math.max(0, endTime - now)
  const h = Math.floor(left / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  return (
    <div className="flex items-center gap-2">
      {[{ v: String(h), l: "годин" }, { v: String(m).padStart(2, '0'), l: "хв" }, { v: String(s).padStart(2, '0'), l: "сек" }].map((u, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="bg-white/15 rounded-lg px-2.5 py-1.5 text-center min-w-[44px]">
            <span className="text-2xl font-black block">{u.v}</span>
            <span className="text-[9px] block opacity-50 tracking-wider">{u.l}</span>
          </span>
          {i < 2 && <span className="text-lg font-black">:</span>}
        </span>
      ))}
    </div>
  )
}

/* ── FAQ ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left text-sm font-medium hover:text-primary transition-colors">
        {q}
        <ChevronDown size={16} className={`shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  )
}

/* ── Checkout Modal ── */
function CheckoutModal({ open, onClose, landing, price, onSuccess }: { open: boolean; onClose: () => void; landing: any; price: number; onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("+380")
  const [sending, setSending] = useState(false)

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { masked } = maskPhoneInput(e.target.value)
    setPhone(masked)
  }

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
      if (res.ok) { onSuccess(); onClose() }
      else { const d = await res.json(); toast.error(d.error || "Помилка") }
    } catch { toast.error("Мережева помилка") }
    finally { setSending(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border z-10 overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-200">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-bold">Оформлення</h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors"><X size={18} className="text-muted-foreground" /></button>
          </div>
          <div className="text-sm text-muted-foreground mb-5 bg-secondary rounded-xl p-3">
            {landing.productName || landing.title} — <b>{price} грн</b>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ім'я</label>
              <div className="relative mt-1.5">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше ім'я" className="w-full h-12 rounded-xl border border-border bg-background pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Телефон *</label>
              <div className="relative mt-1.5">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={phone} onChange={handlePhoneChange} placeholder="+38 (097) 233-63-21" required className="w-full h-12 rounded-xl border border-border bg-background pl-9 pr-3 text-base outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>
            <div className="bg-secondary rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-semibold">До сплати:</span>
              <span className="text-xl font-bold">{price} грн</span>
            </div>
            <button type="submit" disabled={sending} className="w-full flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-bold text-sm rounded-xl hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-[0.98] transition-all disabled:opacity-50">
              <Send size={16} />
              {sending ? "Відправляємо..." : "Підтвердити замовлення"}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">Менеджер передзвонить протягом 15 хвилин</p>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ── Review data ── */
const defaultReviews = [
  { name: "Ігор", city: "Київ", text: "Брав для обрізки винограду. Ріже як по маслу! За два сезони навіть не точив. Рекомендую всім садоводам!", avatar: "", rating: 5 },
  { name: "Тетяна", city: "Полтава", text: "Купила чоловікові в подарунок. Він у захваті — каже, старий секатор поруч не стояв. Швидка доставка!", avatar: "", rating: 5 },
  { name: "Микола", city: "Вінниця", text: "Замовив одразу 3 штуки — собі, батьку і тестю. Сталь реально японська, леза гострі. Для саду ідеальний варіант.", avatar: "", rating: 5 },
  { name: "Олена", city: "Львів", text: "Ручки зручні, не натирають. За день обрізала весь сад, рука не втомилась. Дуже задоволена покупкою!", avatar: "", rating: 5 },
  { name: "Василь", city: "Одеса", text: "Дуже якісний інструмент. Ріже гілки до 2 см без зусиль. Сталь тримає заточку довго.", avatar: "", rating: 5 },
  { name: "Наталя", city: "Дніпро", text: "Замовляла для мами на дачу. Вона в захваті! Каже, такого зручного секатора ще не було.", avatar: "", rating: 5 },
  { name: "Сергій", city: "Хмельницький", text: "Працюю в садовому центрі, перепробував багато секаторів. Цей — один з найкращих за свою ціну.", avatar: "", rating: 5 },
  { name: "Андрій", city: "Чернівці", text: "Купив на заміну старому. Різниця колосальна! Легкий, гострий, зручно лежить в руці.", avatar: "", rating: 5 },
]

type ReviewType = { name: string; city: string; text: string; avatar: string; rating: number }

/* ═══════ MAIN ═══════ */
export default function LandingClient({ landing }: { landing: any }) {
  const images: string[] = (Array.isArray(landing.productImages) && landing.productImages.length > 0)
    ? landing.productImages : landing.productImage ? [landing.productImage] : []
  const mainImg = images[0] || "/placeholder.jpg"
  const price = landing.productPrice || 0
  const oldPrice = landing.productOldPrice || null

  const [showForm, setShowForm] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [showDesc, setShowDesc] = useState(false)
  const [reviewPage, setReviewPage] = useState(0)
  const timerEnd = Date.now() + 8 * 3600000 + 43 * 60000 + 15 * 1000
  const reviewScrollRef = useRef<HTMLDivElement>(null)
  const REVIEWS_PER_PAGE = 4
  // Use custom reviews if set, otherwise fall back to defaults
  const rawReviews: ReviewType[] = (Array.isArray(landing.reviews) && landing.reviews.length > 0) ? landing.reviews : defaultReviews
  const totalPages = Math.ceil(rawReviews.length / REVIEWS_PER_PAGE)

  function scrollReviews(dir: number) {
    const newPage = Math.max(0, Math.min(totalPages - 1, reviewPage + dir))
    setReviewPage(newPage)
    if (reviewScrollRef.current) {
      reviewScrollRef.current.scrollTo({ left: newPage * reviewScrollRef.current.clientWidth, behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen font-sans bg-background text-foreground">

      <CheckoutModal open={showForm} onClose={() => setShowForm(false)} landing={landing} price={price} onSuccess={() => toast.success("Замовлення прийнято! Очікуйте дзвінка менеджера.")} />

      {/* ═══════ HEADER ═══════ */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between">
          <span className="font-serif text-xl font-black tracking-wider text-foreground">OZO</span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground">08:00–21:00</span>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-semibold text-xs rounded-full hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-95 transition-all">
              <ShoppingCart size={14} /> {landing.ctaText || "Купити"}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0B53A4 0%, #074080 40%, #00B5D1 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">

            {/* Photo */}
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative w-full max-w-xs md:max-w-sm">
                <div className="aspect-square rounded-2xl overflow-hidden bg-white/95 shadow-2xl p-3">
                  <img src={images[activeImg] || mainImg} alt="" className="w-full h-full object-contain" />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 mt-3 justify-center">
                    {images.map((url, i) => (
                      <button key={i} onClick={() => setActiveImg(i)} className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? "border-[#00B5D1] shadow-md" : "border-white/80 hover:border-white"}`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Text */}
            <div className="order-2 md:order-1 text-white space-y-4">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif italic leading-tight">{landing.title}</h1>
              <p className="text-base opacity-80 leading-relaxed max-w-md">{landing.subtitle}</p>

              <div className="flex items-center gap-2">
                <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">-47%</span>
                {oldPrice && <span className="text-base line-through opacity-40">{oldPrice} грн</span>}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black">{price}</span>
                <span className="text-lg opacity-60">грн</span>
              </div>

              {/* Timer */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 space-y-1.5 inline-block">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">До кінця акції:</p>
                <CountdownTimer endTime={timerEnd} />
              </div>
              <p className="text-xs opacity-50">Залишилось <b>27 шт</b> за акцією</p>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-emerald-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> В наявності
                </span>
              </div>

              <button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-[#0B53A4] font-bold text-base rounded-full hover:bg-white/90 active:scale-[0.97] transition-all shadow-lg">
                <ShoppingCart size={18} /> {landing.ctaText || "Замовити зі знижкою"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ ADVANTAGES ═══════ */}
      <section className="py-12 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase text-center mb-2">Переваги</p>
          <h2 className="text-xl md:text-2xl font-serif italic text-center mb-8">Чому цей секатор?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <Scissors size={22} className="text-primary" />, title: "Японська сталь SK-5", desc: "Термічно оброблене лезо довго залишається гострим, легко точиться." },
              { icon: <Sprout size={22} className="text-emerald-600" />, title: "Косий зріз 20 мм", desc: "Спеціальний кут леза не заминає рослину. Зріз швидко затягується." },
              { icon: <Shield size={22} className="text-amber-600" />, title: "Алюмінієві ручки", desc: "Легкі, міцні, з TPR-накладками. Рука не втомлюється." },
              { icon: <Check size={22} className="text-primary" />, title: "Надійний фіксатор", desc: "Пластиковий гачок блокує леза в закритому стані. Безпечне зберігання." },
            ].map((a, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="bg-secondary rounded-xl p-2.5 shrink-0">{a.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ USE CASES ═══════ */}
      <section className="py-10 bg-secondary/50">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase text-center mb-2">Для чого підходить</p>
          <h2 className="text-xl md:text-2xl font-serif italic text-center mb-7">Ідеально для</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["🍇 Винограду", "🌳 Плодових дерев", "🌹 Троянд", "🍅 Городу"].map((t, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 text-center font-semibold text-sm hover:border-[#00B5D1]/40 hover:shadow-sm transition-all">{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA BLOCK ═══════ */}
      <section className="py-12 bg-background">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-2xl font-serif italic mb-4">Готові зробити замовлення?</h2>
          <p className="text-sm text-muted-foreground mb-6">Оформіть заявку і ми передзвонимо протягом 15 хвилин</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-bold text-base rounded-xl hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-[0.98] transition-all shadow-md">
            <ShoppingCart size={18} /> {landing.ctaText || "Замовити зараз"}
          </button>
        </div>
      </section>

      {/* ═══════ HOW TO ORDER ═══════ */}
      <section className="py-12 bg-secondary/50">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase text-center mb-2">Як замовити</p>
          <h2 className="text-xl md:text-2xl font-serif italic text-center mb-8">Три прості кроки</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title: "Крок 1", text: "Натисніть «Замовити» та заповніть ім'я й телефон." },
              { title: "Крок 2", text: "Менеджер передзвонить протягом 15 хвилин для підтвердження." },
              { title: "Крок 3", text: "Відправляємо Новою Поштою в день замовлення. Отримуєте за 1–3 дні." },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#0B53A4] to-[#00B5D1] flex items-center justify-center text-white font-black text-lg mb-3">{i + 1}</div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DESCRIPTION (Collapsible) ═══════ */}
      {landing.productDesc && (
        <section className="py-10 bg-background">
          <div className="max-w-3xl mx-auto px-4">
            <button onClick={() => setShowDesc(!showDesc)} className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-[#00B5D1]/40 transition-colors">
              <span className="font-semibold text-sm">Опис товару</span>
              <ChevronDown size={18} className={`text-muted-foreground transition-transform ${showDesc ? "rotate-180" : ""}`} />
            </button>
            {showDesc && (
              <div className="mt-3 bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {landing.productDesc}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════ GALLERY ═══════ */}
      {images.length > 1 && (
        <section className="py-10 bg-secondary/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {images.map((url, i) => (
                <img key={i} src={url} alt="" className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl shadow-sm" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ REVIEWS ═══════ */}
      <section className="py-12 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase text-center mb-2">Відгуки</p>
          <h2 className="text-xl md:text-2xl font-serif italic text-center mb-2">Що кажуть покупці</h2>
          <div className="flex items-center justify-center gap-1.5 mb-7">
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="fill-amber-400 text-amber-400" />)}
            <span className="text-sm font-bold ml-1">5.0</span>
            <span className="text-xs text-muted-foreground">· 127 відгуків</span>
          </div>

          {/* Scrollable row */}
          <div className="relative">
            {totalPages > 1 && (
              <>
                <button onClick={() => scrollReviews(-1)} disabled={reviewPage === 0} className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => scrollReviews(1)} disabled={reviewPage >= totalPages - 1} className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            <div ref={reviewScrollRef} className="overflow-hidden">
              <div className="flex gap-3 transition-transform duration-300" style={{ transform: `translateX(-${reviewPage * 100}%)` }}>
                {Array.from({ length: totalPages }).map((_, pageIdx) => (
                  <div key={pageIdx} className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rawReviews.slice(pageIdx * REVIEWS_PER_PAGE, (pageIdx + 1) * REVIEWS_PER_PAGE).map((r, i) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-2">
                          {r.avatar ? (
                            <img src={r.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B53A4] to-[#00B5D1] flex items-center justify-center text-white font-bold text-xs">{r.name[0]}</div>
                          )}
                          <div>
                            <p className="font-semibold text-xs">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground">{r.city}</p>
                          </div>
                          <div className="ml-auto flex">{[...Array(r.rating || 5)].map((_, j) => <Star key={j} size={10} className="fill-amber-400 text-amber-400" />)}</div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dots */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => { setReviewPage(i); reviewScrollRef.current?.scrollTo({ left: i * (reviewScrollRef.current?.clientWidth || 0), behavior: "smooth" }) }} className={`w-2 h-2 rounded-full transition-all ${i === reviewPage ? "bg-primary w-5" : "bg-border hover:bg-muted-foreground/30"}`} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ DELIVERY ═══════ */}
      <section className="py-10 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: <Truck size={28} />, title: "Доставка", sub: "Нова Пошта, 1–3 дні" },
              { icon: <RotateCcw size={28} />, title: "Повернення", sub: "14 днів без зайвих питань" },
              { icon: <Shield size={28} />, title: "Оплата", sub: "При отриманні" },
            ].map((d, i) => (
              <div key={i} className="space-y-1">
                <div className="opacity-80 flex justify-center">{d.icon}</div>
                <p className="font-semibold text-sm">{d.title}</p>
                <p className="text-xs opacity-60">{d.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-12 bg-background">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase text-center mb-2">FAQ</p>
          <h2 className="text-xl md:text-2xl font-serif italic text-center mb-7">Поширені запитання</h2>
          <div className="bg-card border border-border rounded-xl px-5">
            <FaqItem q="Як швидко відправляєте?" a="Відправляємо в день замовлення (якщо до 16:00) або наступного дня. Доставка 1–3 дні." />
            <FaqItem q="Чи можна повернути товар?" a="Так, повернення протягом 14 днів без зайвих питань." />
            <FaqItem q="Яка гарантія?" a="Гарантія 12 місяців. У разі дефекту — заміна або повернення коштів." />
            <FaqItem q="Як оплатити?" a="Оплата при отриманні на відділенні Нової Пошти. Також можлива передоплата." />
          </div>
        </div>
      </section>

      {/* ═══════ STICKY MOBILE BAR ═══════ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card border-t border-border px-4 py-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold">{price} грн</div>
            {oldPrice && <div className="text-xs text-muted-foreground line-through">{oldPrice} грн</div>}
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-bold text-sm rounded-full active:scale-95 transition-all">
            <ShoppingCart size={16} /> {landing.ctaText || "Купити"}
          </button>
        </div>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-8 bg-background border-t border-border pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg font-black tracking-wider text-foreground">OZO</span>
          <p className="text-[10px] text-muted-foreground tracking-wider">© 2020–{new Date().getFullYear()} OZO. Графік роботи: Пн–Нд 08:00–21:00</p>
        </div>
      </footer>

    </div>
  )
}
