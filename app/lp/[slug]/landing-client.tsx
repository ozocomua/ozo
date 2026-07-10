"use client"

import { useState, useEffect, useCallback } from "react"
import { ShoppingCart, Check, Shield, Truck, RotateCcw, Star, ChevronDown, ChevronUp, Clock, Award, Droplets, Zap, Wrench } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"

// ── Countdown timer ──
function CountdownTimer({ endTime }: { endTime: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  const left = Math.max(0, endTime - now)
  const h = Math.floor(left / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)

  return (
    <div className="flex items-center gap-3 text-white">
      <div className="text-center"><span className="text-2xl md:text-3xl font-black">{h}</span><div className="text-[9px] opacity-60">годин</div></div>
      <span className="text-xl font-black">:</span>
      <div className="text-center"><span className="text-2xl md:text-3xl font-black">{String(m).padStart(2, '0')}</span><div className="text-[9px] opacity-60">хвилин</div></div>
      <span className="text-xl font-black">:</span>
      <div className="text-center"><span className="text-2xl md:text-3xl font-black">{String(s).padStart(2, '0')}</span><div className="text-[9px] opacity-60">секунд</div></div>
    </div>
  )
}

// ── Star rating ──
function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={16} className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
        ))}
      </div>
      <span className="text-sm font-bold">{rating.toFixed(1)}</span>
      <span className="text-sm opacity-50">({count} відгуків)</span>
    </div>
  )
}

// ── FAQ accordion ──
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/10 py-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left font-bold text-sm">
        {q}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <p className="mt-2 text-sm opacity-70 leading-relaxed">{a}</p>}
    </div>
  )
}

// ── Tabs ──
function Tabs({ tabs, active, onTab }: { tabs: { key: string; label: string }[]; active: string; onTab: (k: string) => void }) {
  return (
    <div className="flex gap-2 border-b border-black/10 pb-2 mb-6 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onTab(t.key)}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${active === t.key ? "bg-[#0B53A4] text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function LandingClient({ landing }: { landing: any }) {
  const { addToCart } = useCart()
  const product = landing.product
  const mainImg = product.images?.find((i: any) => i.isMain)?.url || product.images?.[0]?.url || "/placeholder.jpg"
  const images = product.images?.map((i: any) => i.url) || []

  // Default multi-quantity prices (fallback if not set)
  const defaultTiers = [
    { qty: 1, pricePerUnit: product.price || 0, oldPrice: product.oldPrice || null, save: 0 },
    { qty: 5, pricePerUnit: Math.round((product.price || 0) * 0.8), oldPrice: null, save: 20 },
    { qty: 10, pricePerUnit: Math.round((product.price || 0) * 0.7), oldPrice: null, save: 30 },
    { qty: 15, pricePerUnit: Math.round((product.price || 0) * 0.6), oldPrice: null, save: 40 },
  ]

  const [selectedQty, setSelectedQty] = useState(0) // 0 = first tier
  const [adding, setAdding] = useState(false)
  const [reviewTab, setReviewTab] = useState("all")
  const [selectedImg, setSelectedImg] = useState(0)

  // Timer: 10 hours from page load
  const timerEnd = Date.now() + 10 * 3600000 + 52 * 60000 + 30 * 1000

  const tier = defaultTiers[selectedQty]
  const totalPrice = tier ? tier.pricePerUnit * tier.qty : 0

  async function handleBuy() {
    setAdding(true)
    await addToCart(product.id, tier.qty)
    toast.success(`${tier.qty} шт додано в кошик!`)
    setTimeout(() => { window.location.href = "/checkout" }, 500)
  }

  // Mock reviews
  const reviews = [
    { id: 1, name: "Олег", city: "Харків", age: 40, rating: 5, text: "Мої птахи задоволені і я теж. На все про все пішло 5 хвилин, а тепер економить мені багато часу.", photos: 0 },
    { id: 2, name: "Катерина", city: "Долинська", age: 49, rating: 5, text: "Ось і знайшлось застосування для старого відерка. Тепер кури та качки п'ють чисту воду.", photos: 0 },
    { id: 3, name: "Людмила", city: "Сумська обл.", age: 52, rating: 5, text: "Поставила одразу 2 штуки. Дуже зручно що автоматично наповнюється і піднімається, коли всередині пусто.", photos: 0 },
    { id: 4, name: "Олександр", city: "Львів", age: 36, rating: 5, text: "Останній раз як приїжджав у село, так набридло постійно носити воду. Тепер привіз 2 штуки та причепив до відра. Тепер один раз в день налив і все.", photos: 0 },
  ]

  return (
    <div className="min-h-screen font-sans bg-white text-[#1a1a1a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ═══════ HERO ═══════ */}
      <section className="relative bg-gradient-to-b from-[#0B53A4] to-[#0a4190] text-white overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <a href="/" className="font-serif text-xl font-black tracking-wider opacity-80 hover:opacity-100">OZO</a>
            <div className="text-xs opacity-60">Графік роботи: Пн-Нд: 08:00-21:00</div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left */}
            <div className="space-y-5">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight uppercase">
                {landing.title}
              </h1>
              <p className="text-base md:text-lg opacity-80 leading-relaxed">
                {landing.subtitle || "Допоможе зручно напоїти малу та дорослу птицю"}
              </p>

              {/* Discount badge */}
              <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full font-black text-sm">
                <Zap size={16} /> 51% знижка
              </div>

              {/* Prices */}
              <div className="space-y-1">
                {product.oldPrice && (
                  <div className="text-lg line-through opacity-50">Стара ціна: <span className="text-xl">{product.oldPrice} грн</span></div>
                )}
                <div className="text-xl md:text-2xl font-black">
                  Акційна ціна: <span className="text-3xl md:text-4xl">{tier.pricePerUnit} грн</span>
                </div>
              </div>

              {/* Timer */}
              <div className="bg-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider">Пропозиція діє:</p>
                <CountdownTimer endTime={timerEnd} />
              </div>

              <p className="text-sm opacity-60">Залишилось <b>42 шт</b> за акцією</p>

              {/* CTA */}
              <button
                onClick={handleBuy}
                disabled={adding}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-red-500 hover:bg-red-600 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl active:scale-[0.97] transition-all uppercase"
              >
                {adding ? "Додаємо..." : (
                  <>
                    <ShoppingCart size={22} />
                    {landing.ctaText || "Замовити зі знижкою"}
                  </>
                )}
              </button>
            </div>

            {/* Right — image */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-white p-4 shadow-2xl">
                <img src={mainImg} alt={product.name} className="w-full h-full object-contain" />
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">-51%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ borderRadius: "50% 50% 0 0", transform: "translateY(50%)" }} />
      </section>

      {/* ═══════ ADVANTAGES ═══════ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
            Чим особлива <br />наша продукція?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Check size={28} className="text-emerald-500" />, title: "Автоматично подає та зупиняє потік води", desc: "" },
              { icon: <Wrench size={28} className="text-blue-500" />, title: "Легко встановлюється на відро чи ємність", desc: "" },
              { icon: <Shield size={28} className="text-amber-500" />, title: "Міцне кріплення стійке до навантажень", desc: "" },
              { icon: <Droplets size={28} className="text-sky-500" />, title: "Екологічний матеріал не впливає на якість", desc: "" },
              { icon: <Zap size={28} className="text-purple-500" />, title: "Зручно та швидко миється", desc: "" },
              { icon: <Award size={28} className="text-rose-500" />, title: "Гарантія якості від виробника", desc: "" },
            ].map((a, i) => (
              <div key={i} className="bg-[#F9F9F7] rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="bg-white rounded-xl p-3 shadow-sm shrink-0">{a.icon}</div>
                <div>
                  <p className="font-bold text-sm leading-tight">{a.title}</p>
                  {a.desc && <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ QUANTITY SELECTOR ═══════ */}
      <section className="py-16 bg-[#F0F4F8]">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Оберіть кількість</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {defaultTiers.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedQty(i)}
                className={`rounded-2xl p-5 text-center transition-all border-2 ${
                  selectedQty === i
                    ? "border-[#0B53A4] bg-white shadow-lg scale-[1.02]"
                    : "border-transparent bg-white hover:border-gray-200 hover:shadow"
                }`}
              >
                <div className="text-2xl font-black">{t.qty} шт</div>
                <div className="text-lg font-bold mt-1">{t.pricePerUnit} грн/шт</div>
                {t.oldPrice && <div className="text-xs line-through opacity-40">{t.oldPrice} грн</div>}
                {t.save > 0 && (
                  <div className="mt-2 inline-block bg-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded-full">
                    -{t.save}%
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm opacity-50">
              {selectedQty > 0 && <>Економія <b>{defaultTiers[selectedQty].save}%</b> при замовленні <b>{defaultTiers[selectedQty].qty} шт</b></>}
            </p>
          </div>

          {/* Big CTA */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={handleBuy}
              disabled={adding}
              className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl active:scale-[0.97] transition-all uppercase"
            >
              <ShoppingCart size={24} />
              {adding ? "Додаємо..." : `Замовити ${tier.qty} шт за ${totalPrice} грн`}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ STEPS ═══════ */}
      {landing.steps && landing.steps.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
              Як замовити <br />за лічені хвилини!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {landing.steps.map((step: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#0B53A4] to-[#00B5D1] flex items-center justify-center text-white font-black text-2xl mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-black text-lg mb-2">{step.title}</h3>
                  <p className="text-sm opacity-60">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ DESCRIPTION ═══════ */}
      {product.fullDescription && (
        <section className="py-16 bg-[#F9F9F7]">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Про товар</h2>
            <div className="prose prose-sm max-w-none opacity-70 leading-relaxed whitespace-pre-line text-center">
              {product.fullDescription}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ REVIEWS ═══════ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-8">Відгуки клієнтів</h2>
          <div className="text-center mb-8">
            <Stars rating={5} count={127} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-[#F9F9F7] rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B53A4] to-[#00B5D1] flex items-center justify-center text-white font-black text-sm">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{r.name}</p>
                    <p className="text-xs opacity-40">{r.city}, {r.age} років</p>
                  </div>
                  <div className="ml-auto flex">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className="fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
                <p className="text-sm opacity-70 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DELIVERY ═══════ */}
      <section className="py-12 bg-[#0B53A4] text-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <Truck size={32} className="mx-auto opacity-80" />
              <p className="font-bold">Доставка Новою Поштою</p>
              <p className="text-sm opacity-60">1-3 дні по всій Україні</p>
            </div>
            <div className="space-y-2">
              <RotateCcw size={32} className="mx-auto opacity-80" />
              <p className="font-bold">Повернення 14 днів</p>
              <p className="text-sm opacity-60">Без зайвих питань</p>
            </div>
            <div className="space-y-2">
              <Shield size={32} className="mx-auto opacity-80" />
              <p className="font-bold">Оплата при отриманні</p>
              <p className="text-sm opacity-60">Накладений платіж</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-16 bg-[#F9F9F7]">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Поширені запитання</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <FaqItem q="Як швидко відправляєте замовлення?" a="Відправляємо в день замовлення або наступного дня. Доставка Новою Поштою займає 1-3 дні." />
            <FaqItem q="Чи можна повернути товар?" a="Так, повернення протягом 14 днів без зайвих питань, згідно із законодавством України." />
            <FaqItem q="Які гарантії?" a="Надаємо гарантію від виробника. У разі дефекту — заміна або повернення коштів." />
            <FaqItem q="Як оплатити?" a="Оплата при отриманні на відділенні Нової Пошти (накладений платіж). Також можлива передоплата на карту." />
          </div>
        </div>
      </section>

      {/* ═══════ BOTTOM CTA ═══════ */}
      <section className="py-12 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white">
        <div className="mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-black uppercase">{landing.title}</h2>
          <p className="opacity-80">{landing.subtitle}</p>
          <button
            onClick={handleBuy}
            disabled={adding}
            className="inline-flex items-center gap-3 px-10 py-5 bg-red-500 hover:bg-red-600 text-white font-black text-xl rounded-2xl shadow-xl active:scale-[0.97] transition-all uppercase"
          >
            <ShoppingCart size={24} />
            {adding ? "Додаємо..." : `${landing.ctaText || "Замовити зі знижкою"}`}
          </button>
          <p className="text-sm opacity-50">Графік роботи: Пн-Нд: 08:00-21:00</p>
        </div>
      </section>
    </div>
  )
}
