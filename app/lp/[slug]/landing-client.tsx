"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Star, ChevronDown, ChevronUp, Scissors, Shield, Truck, RotateCcw, Check, Sprout } from "lucide-react"
import { toast } from "sonner"

function CountdownTimer({ endTime }: { endTime: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(iv) }, [])
  const left = Math.max(0, endTime - now)
  const h = Math.floor(left / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  return (
    <div className="flex items-center gap-3 text-white">
      {[{ v: String(h), l: "годин" }, { v: String(m).padStart(2, '0'), l: "хвилин" }, { v: String(s).padStart(2, '0'), l: "секунд" }].map((u, i) => (
        <span key={i} className="flex items-center gap-3">
          <div className="text-center"><span className="text-2xl md:text-3xl font-black">{u.v}</span><div className="text-[9px] opacity-60">{u.l}</div></div>
          {i < 2 && <span className="text-xl font-black">:</span>}
        </span>
      ))}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/10 py-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left font-bold text-sm">{q}{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      {open && <p className="mt-2 text-sm opacity-70 leading-relaxed">{a}</p>}
    </div>
  )
}

export default function LandingClient({ landing }: { landing: any }) {
  const images: string[] = (Array.isArray(landing.productImages) && landing.productImages.length > 0)
    ? landing.productImages
    : landing.productImage ? [landing.productImage] : []
  const mainImg = images[0] || "/placeholder.jpg"
  const price = landing.productPrice || 0
  const oldPrice = landing.productOldPrice || null

  const tiers = [
    { qty: 1, pricePerUnit: price, oldPerUnit: oldPrice, save: 0 },
    { qty: 3, pricePerUnit: Math.round(price * 0.85), oldPerUnit: Math.round((oldPrice || price * 1.3) * 0.85), save: 15 },
    { qty: 5, pricePerUnit: Math.round(price * 0.75), oldPerUnit: Math.round((oldPrice || price * 1.3) * 0.75), save: 25 },
    { qty: 10, pricePerUnit: Math.round(price * 0.65), oldPerUnit: Math.round((oldPrice || price * 1.3) * 0.65), save: 35 },
  ]

  const [selectedQty, setSelectedQty] = useState(0)
  const [adding, setAdding] = useState(false)
  const timerEnd = Date.now() + 8 * 3600000 + 43 * 60000 + 15 * 1000
  const tier = tiers[selectedQty]
  const totalPrice = tier.pricePerUnit * tier.qty

  async function handleBuy() {
    setAdding(true)
    try {
      const res = await fetch("/api/checkout/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: landing.productName || landing.title,
          price: tier.pricePerUnit,
          oldPrice: tier.oldPerUnit,
          qty: tier.qty,
          image: mainImg,
          slug: landing.slug,
        }),
      })
      if (res.ok) { const d = await res.json(); if (d.checkoutUrl) { window.location.href = d.checkoutUrl; return } }
    } catch { /* fallback */ }
    toast.success("Замовлення оформлено! Ми зв'яжемось з вами.")
    setAdding(false)
  }

  const reviews = [
    { name: "Ігор", city: "Київ", text: "Брав для обрізки винограду. Ріже як по маслу! За два сезони навіть не точив. Рекомендую всім садоводам!" },
    { name: "Тетяна", city: "Полтава", text: "Купила чоловікові в подарунок. Він у захваті — каже, старий секатор поруч не стояв. Швидка доставка, дякую!" },
    { name: "Микола", city: "Вінниця", text: "Замовив одразу 3 штуки — собі, батьку і тестю. Сталь реально японська, леза гострі. Для саду ідеальний варіант." },
    { name: "Олена", city: "Львів", text: "Маленька рука, а секатор лягає ідеально — ручки зручні, не натирають. За день обрізала весь сад, рука не втомилась." },
  ]

  return (
    <div className="min-h-screen font-sans bg-white text-[#1a1a1a]" suppressHydrationWarning>

      {/* ═══════ HERO ═══════ */}
      <section className="bg-gradient-to-b from-[#0d5e2e] to-[#0a4a24] text-white relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
          <div className="flex items-center justify-between mb-8">
            <a href="/" className="font-serif text-xl font-black tracking-wider opacity-80 hover:opacity-100">OZO</a>
            <div className="text-xs opacity-60">Графік роботи: Пн-Нд: 08:00-21:00</div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight uppercase">
                {landing.title}
              </h1>
              <p className="text-base md:text-lg opacity-80 leading-relaxed">
                {landing.subtitle || "Японська сталь SK-5. Чистий різ без заминання гілок"}
              </p>

              <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full font-black text-sm">
                🔥 47% знижка
              </div>

              <div className="space-y-1">
                {tier.oldPerUnit && <div className="text-lg line-through opacity-50">Стара ціна: <span className="text-xl font-black">{tier.oldPerUnit} грн</span></div>}
                <div className="text-lg font-black opacity-80">Акційна ціна:</div>
                <div className="text-3xl md:text-4xl font-black">{tier.pricePerUnit} грн</div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider">Пропозиція діє:</p>
                <CountdownTimer endTime={timerEnd} />
              </div>
              <p className="text-sm opacity-60">Залишилось <b>27 шт</b> за акцією</p>

              <button onClick={handleBuy} disabled={adding}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-red-500 hover:bg-red-600 text-white font-black text-lg rounded-2xl shadow-xl active:scale-[0.97] transition-all uppercase">
                <ShoppingCart size={22} />
                {adding ? "Оформлюємо..." : landing.ctaText || "Замовити зі знижкою"}
              </button>
            </div>

            <div className="flex justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-white p-4 shadow-2xl">
                <img src={mainImg} alt={landing.title} className="w-full h-full object-contain" />
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">-47%</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-white" style={{ borderRadius: "50% 50% 0 0", transform: "translateY(50%)" }} />
      </section>

      {/* ═══════ ADVANTAGES ═══════ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
            Чим особливий<br />цей секатор?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: <Scissors size={28} className="text-emerald-600" />, title: "Японська сталь SK-5", desc: "Лезо проходить термічну обробку. Довго залишається гострим, легко точиться." },
              { icon: <Sprout size={28} className="text-green-600" />, title: "Косий зріз 20 мм", desc: "Спеціальний кут леза не заминає рослину. Зріз швидко затягується." },
              { icon: <Shield size={28} className="text-amber-600" />, title: "Алюмінієві ручки", desc: "Легкі, міцні, з прогумованими TPR-накладками. Рука не втомлюється." },
              { icon: <Check size={28} className="text-blue-600" />, title: "Надійний фіксатор", desc: "Пластиковий накидний гачок блокує леза в закритому стані. Безпечне зберігання." },
            ].map((a, i) => (
              <div key={i} className="bg-[#F5F9F2] rounded-2xl p-6 flex items-start gap-5 hover:shadow-md transition-shadow">
                <div className="bg-white rounded-xl p-3 shadow-sm shrink-0">{a.icon}</div>
                <div>
                  <p className="font-black text-sm leading-tight">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ USE CASES ═══════ */}
      <section className="py-16 bg-[#F5F9F2]">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
            Секатор<br />для різних завдань
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "🍇 Винограду", "🌳 Плодових дерев", "🌹 Троянд і кущів", "🍅 Городу",
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 text-center font-bold text-sm shadow-sm hover:shadow-md transition-shadow">{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ QUANTITY SELECTOR ═══════ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-4">Оберіть кількість</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {tiers.map((t, i) => (
              <button key={i} onClick={() => setSelectedQty(i)}
                className={`rounded-2xl p-5 text-center transition-all border-2 ${selectedQty === i ? "border-[#0d5e2e] bg-[#F5F9F2] shadow-lg scale-[1.02]" : "border-transparent bg-[#F9F9F7] hover:border-gray-200"}`}>
                <div className="text-2xl font-black">{t.qty} шт</div>
                <div className="text-lg font-bold mt-1">{t.pricePerUnit} грн/шт</div>
                {t.save > 0 && <div className="mt-2 inline-block bg-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded-full">-{t.save}%</div>}
              </button>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-sm opacity-50">
              {selectedQty > 0 && <>Економія <b>{tiers[selectedQty].save}%</b> при замовленні <b>{tiers[selectedQty].qty} шт</b></>}
            </p>
            <button onClick={handleBuy} disabled={adding}
              className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-[#0d5e2e] to-[#16a34a] text-white font-black text-xl rounded-2xl shadow-xl active:scale-[0.97] transition-all uppercase">
              <ShoppingCart size={24} />
              {adding ? "Оформлюємо..." : `Замовити ${tier.qty} шт за ${totalPrice} грн`}
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ STEPS ═══════ */}
      <section className="py-16 bg-[#F9F9F7]">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">
            Як замовити<br />за лічені хвилини!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Крок 1", text: "Оберіть кількість і натисніть «Замовити». Заповніть ім'я та телефон." },
              { title: "Крок 2", text: "Ми передзвонимо протягом 15 хвилин для підтвердження замовлення." },
              { title: "Крок 3", text: "Відправляємо Новою Поштою в день замовлення. Ви отримуєте за 1-3 дні." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#0d5e2e] to-[#16a34a] flex items-center justify-center text-white font-black text-2xl mb-4">{i + 1}</div>
                <h3 className="font-black text-lg mb-2">{s.title}</h3>
                <p className="text-sm opacity-60">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DESCRIPTION ═══════ */}
      {landing.productDesc && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Опис товару</h2>
            <div className="opacity-70 leading-relaxed whitespace-pre-line text-sm">
              {landing.productDesc}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ GALLERY ═══════ */}
      {images.length > 1 && (
        <section className="py-12 bg-[#F9F9F7]">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <div className="flex flex-wrap gap-4 justify-center">
              {images.map((url: string, i: number) => (
                <img key={i} src={url} alt="" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl shadow-sm" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ REVIEWS ═══════ */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-3">Відгуки клієнтів</h2>
          <div className="flex justify-center items-center gap-2 mb-8">
            <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="fill-amber-400 text-amber-400" />)}</div>
            <span className="text-sm font-bold">5.0</span>
            <span className="text-sm opacity-50">(89 відгуків)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r, i) => (
              <div key={i} className="bg-[#F5F9F2] rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0d5e2e] to-[#16a34a] flex items-center justify-center text-white font-black text-sm">{r.name[0]}</div>
                  <div>
                    <p className="font-bold text-sm">{r.name}</p>
                    <p className="text-xs opacity-40">{r.city}</p>
                  </div>
                  <div className="ml-auto flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className="fill-amber-400 text-amber-400" />)}</div>
                </div>
                <p className="text-sm opacity-70 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ DELIVERY ═══════ */}
      <section className="py-12 bg-[#0d5e2e] text-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-2"><Truck size={32} className="mx-auto opacity-80" /><p className="font-bold">Доставка Новою Поштою</p><p className="text-sm opacity-60">1-3 дні по всій Україні</p></div>
            <div className="space-y-2"><RotateCcw size={32} className="mx-auto opacity-80" /><p className="font-bold">Повернення 14 днів</p><p className="text-sm opacity-60">Без зайвих питань</p></div>
            <div className="space-y-2"><Shield size={32} className="mx-auto opacity-80" /><p className="font-bold">Оплата при отриманні</p><p className="text-sm opacity-60">Накладений платіж</p></div>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="py-16 bg-[#F9F9F7]">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Поширені запитання</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <FaqItem q="Як швидко відправляєте замовлення?" a="Відправляємо в день замовлення (якщо до 16:00) або наступного дня. Доставка Новою Поштою 1-3 дні." />
            <FaqItem q="Чи можна повернути товар?" a="Так, повернення протягом 14 днів без зайвих питань згідно із законодавством України." />
            <FaqItem q="Яка гарантія на секатор?" a="Гарантія 12 місяців від виробника. У разі дефекту — заміна або повернення коштів." />
            <FaqItem q="Як оплатити?" a="Оплата при отриманні на відділенні Нової Пошти (накладений платіж). Також можлива передоплата на карту ПриватБанку." />
          </div>
        </div>
      </section>

      {/* ═══════ BOTTOM CTA ═══════ */}
      <section className="py-12 bg-gradient-to-r from-[#0d5e2e] to-[#16a34a] text-white">
        <div className="mx-auto max-w-3xl px-4 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-black uppercase">{landing.title}</h2>
          <p className="opacity-80">{landing.subtitle || "Японська сталь SK-5. Чистий різ без заминання гілок."}</p>
          <div className="text-3xl font-black">{tier.pricePerUnit} грн</div>
          <button onClick={handleBuy} disabled={adding}
            className="inline-flex items-center gap-3 px-10 py-5 bg-red-500 hover:bg-red-600 text-white font-black text-xl rounded-2xl shadow-xl active:scale-[0.97] transition-all uppercase">
            <ShoppingCart size={24} />
            {adding ? "Оформлюємо..." : landing.ctaText || "Замовити зі знижкою"}
          </button>
          <p className="text-sm opacity-50">Графік роботи: Пн-Нд: 08:00-21:00</p>
        </div>
      </section>
    </div>
  )
}
