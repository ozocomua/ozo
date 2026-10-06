"use client"

import { useState, useEffect, useMemo } from "react"

type Product = { id: number; name: string }
type Entry = { id: number; productName: string; amount: number; comment: string | null; createdAt: string }
type Expense = { id: number; amount: number; comment: string | null; createdAt: string }
type Period = "all" | "today" | "7d" | "30d"

const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "Весь час" },
  { key: "today", label: "Сьогодні" },
  { key: "7d", label: "7 днів" },
  { key: "30d", label: "30 днів" },
]

type CombinedItem = {
  kind: "profit" | "ad"
  id: number
  title: string
  amount: number
  comment: string | null
  createdAt: string
}

export default function ProfitPage() {
  const [loaded, setLoaded] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [period, setPeriod] = useState<Period>("all")

  // profit form
  const [productId, setProductId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)

  // ads form
  const [adAmount, setAdAmount] = useState("")
  const [adComment, setAdComment] = useState("")
  const [adBusy, setAdBusy] = useState(false)

  const load = () => {
    Promise.all([
      fetch("/api/admin/profit").then((r) => r.json()),
      fetch("/api/admin/ads").then((r) => r.json()),
    ])
      .then(([profitData, adsData]) => {
        setEntries(profitData.entries || [])
        setProducts(profitData.products || [])
        setExpenses(adsData.expenses || [])
      })
      .finally(() => setLoaded(true))
  }

  useEffect(() => {
    load()
  }, [])

  const inPeriod = (d: Date) => {
    const now = new Date()
    if (period === "today") return d.toDateString() === now.toDateString()
    if (period === "7d") return d.getTime() >= now.getTime() - 7 * 24 * 3600 * 1000
    if (period === "30d") return d.getTime() >= now.getTime() - 30 * 24 * 3600 * 1000
    return true
  }

  const filteredEntries = useMemo(() => entries.filter((e) => inPeriod(new Date(e.createdAt))), [entries, period])
  const filteredExpenses = useMemo(() => expenses.filter((e) => inPeriod(new Date(e.createdAt))), [expenses, period])

  const profitTotal = useMemo(() => filteredEntries.reduce((s, e) => s + (e.amount || 0), 0), [filteredEntries])
  const adsTotal = useMemo(() => filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0), [filteredExpenses])
  const net = profitTotal - adsTotal
  const roi = adsTotal > 0 ? profitTotal / adsTotal : null

  const byProduct = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>()
    filteredEntries.forEach((e) => {
      const cur = map.get(e.productName) || { sum: 0, count: 0 }
      cur.sum += e.amount || 0
      cur.count += 1
      map.set(e.productName, cur)
    })
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.sum - a.sum)
  }, [filteredEntries])
  const maxSum = Math.max(1, ...byProduct.map((p) => p.sum))

  const combined = useMemo<CombinedItem[]>(() => {
    const profit: CombinedItem[] = filteredEntries.map((e) => ({
      kind: "profit",
      id: e.id,
      title: e.productName,
      amount: e.amount,
      comment: e.comment,
      createdAt: e.createdAt,
    }))
    const ads: CombinedItem[] = filteredExpenses.map((e) => ({
      kind: "ad",
      id: e.id,
      title: "Реклама",
      amount: e.amount,
      comment: e.comment,
      createdAt: e.createdAt,
    }))
    return [...profit, ...ads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [filteredEntries, filteredExpenses])

  const addProfit = async () => {
    const product = products.find((p) => p.id === Number(productId))
    const val = parseFloat(amount)
    if (!product || Number.isNaN(val)) return
    setBusy(true)
    try {
      const res = await fetch("/api/admin/profit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: product.name, amount: val, comment: comment.trim() }),
      })
      if (res.ok) {
        setAmount("")
        setProductId("")
        setComment("")
        load()
      }
    } finally {
      setBusy(false)
    }
  }

  const addAd = async () => {
    const val = parseFloat(adAmount)
    if (Number.isNaN(val)) return
    setAdBusy(true)
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val, comment: adComment.trim() }),
      })
      if (res.ok) {
        setAdAmount("")
        setAdComment("")
        load()
      }
    } finally {
      setAdBusy(false)
    }
  }

  const removeProfit = async (id: number) => {
    if (!confirm("Видалити цей запис?")) return
    await fetch("/api/admin/profit", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    load()
  }

  const removeAd = async (id: number) => {
    if (!confirm("Видалити цей запис?")) return
    await fetch("/api/admin/ads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    load()
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">Завантаження...</p>
      </div>
    )
  }

  const periodLabel = PERIODS.find((p) => p.key === period)?.label

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Прибуток OZO</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Прибуток з продажів і витрати на рекламу — щоб бачити, чи окупається.
        </p>
      </div>

      {/* ── Period selector ── */}
      <div className="flex gap-2 overflow-x-auto">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={
              "shrink-0 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors " +
              (period === p.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-muted-foreground border-black/10 hover:border-black")
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Прибуток</p>
          <p className="text-xl font-black mt-1 text-green-600">
            {Math.round(profitTotal).toLocaleString("uk-UA")} ₴
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Реклама</p>
          <p className="text-xl font-black mt-1 text-red-500">
            −{Math.round(adsTotal).toLocaleString("uk-UA")} ₴
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Чистий</p>
          <p className={"text-xl font-black mt-1 " + (net >= 0 ? "text-emerald-600" : "text-red-500")}>
            {net >= 0 ? "+" : "−"}
            {Math.abs(Math.round(net)).toLocaleString("uk-UA")} ₴
          </p>
        </div>
      </div>

      {/* ── ROI / окупність ── */}
      <div className="rounded-2xl border bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Чи окупається реклама · {periodLabel}
          </h2>
          {adsTotal > 0 && (
            <span
              className={
                "text-[10px] font-black uppercase px-2 py-1 rounded-full " +
                (net >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")
              }
            >
              {net >= 0 ? "✅ Окупається" : "⚠️ У мінусі"}
            </span>
          )}
        </div>

        {adsTotal === 0 ? (
          <p className="text-sm text-muted-foreground">
            Додай витрати на рекламу нижче — і тут з'явиться порівняння.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">Прибуток</span>
                  <span className="font-bold text-green-600">{Math.round(profitTotal).toLocaleString("uk-UA")} ₴</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((profitTotal / Math.max(profitTotal, adsTotal)) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">Реклама</span>
                  <span className="font-bold text-red-500">{Math.round(adsTotal).toLocaleString("uk-UA")} ₴</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((adsTotal / Math.max(profitTotal, adsTotal)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {roi !== null &&
                (net >= 0
                  ? `На кожну 1 грн реклами — ${roi.toFixed(2)} грн прибутку.`
                  : `Реклама поки не окупається: в мінусі ${Math.round(Math.abs(net)).toLocaleString("uk-UA")} грн.`)}
            </p>
          </>
        )}
      </div>

      {/* ── By product ── */}
      {byProduct.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Що продається більше / менше
          </h2>
          <div className="space-y-3">
            {byProduct.map((p) => (
              <div key={p.name}>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <span className="text-xs font-bold text-green-600 whitespace-nowrap">
                    {Math.round(p.sum).toLocaleString("uk-UA")} ₴
                    <span className="text-muted-foreground font-normal"> · {p.count} зап.</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((p.sum / maxSum) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add forms ── */}
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Додати запис</h2>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 uppercase block">Товар (прибуток)</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
          >
            <option value="">Оберіть товар…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Прибуток, грн (напр. 300)"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Коментар (напр. продав 3 шт)"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={addProfit}
            disabled={busy || !productId || !amount}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl uppercase text-sm tracking-wide transition-colors active:scale-[0.99]"
          >
            {busy ? "Додавання..." : "+ Додати прибуток"}
          </button>
        </div>

        <div className="border-t pt-4 space-y-2">
          <label className="text-xs font-bold text-slate-600 uppercase block">Витрати на рекламу</label>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={adAmount}
            onChange={(e) => setAdAmount(e.target.value)}
            placeholder="Сума, грн (напр. 580)"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400"
          />
          <input
            type="text"
            value={adComment}
            onChange={(e) => setAdComment(e.target.value)}
            placeholder="Коментар (напр. TikTok, день 1)"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400"
          />
          <button
            onClick={addAd}
            disabled={adBusy || !adAmount}
            className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl uppercase text-sm tracking-wide transition-colors active:scale-[0.99]"
          >
            {adBusy ? "Додавання..." : "+ Додати рекламу"}
          </button>
        </div>
      </div>

      {/* ── Entries ── */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        {combined.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            {entries.length === 0 && expenses.length === 0
              ? "Ще немає записів. Додай перший вище."
              : "Немає записів за цей період."}
          </div>
        ) : (
          <ul className="divide-y">
            {combined.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.kind === "ad" && <span className="text-red-500">📢 </span>}
                    {item.title}
                  </p>
                  {item.comment ? (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">💬 {item.comment}</p>
                  ) : null}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("uk-UA", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={
                    "font-bold whitespace-nowrap " +
                    (item.kind === "profit" ? "text-green-600" : "text-red-500")
                  }
                >
                  {item.kind === "profit" ? "+" : "−"}
                  {Math.round(item.amount).toLocaleString("uk-UA")} ₴
                </span>
                <button
                  onClick={() => (item.kind === "profit" ? removeProfit(item.id) : removeAd(item.id))}
                  className="text-slate-300 hover:text-red-500 text-lg leading-none px-1"
                  aria-label="Видалити"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
