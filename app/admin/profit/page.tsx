"use client"

import { useState, useEffect, useMemo } from "react"

type Product = { id: number; name: string }
type Entry = { id: number; productName: string; amount: number; comment: string | null; createdAt: string }
type Period = "all" | "today" | "7d" | "30d"

const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "Весь час" },
  { key: "today", label: "Сьогодні" },
  { key: "7d", label: "7 днів" },
  { key: "30d", label: "30 днів" },
]

export default function ProfitPage() {
  const [loaded, setLoaded] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [productId, setProductId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [comment, setComment] = useState("")
  const [period, setPeriod] = useState<Period>("all")
  const [busy, setBusy] = useState(false)

  const load = () => {
    fetch("/api/admin/profit")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries || [])
        setProducts(d.products || [])
      })
      .finally(() => setLoaded(true))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    return entries.filter((e) => {
      const d = new Date(e.createdAt)
      if (period === "today") return d.toDateString() === now.toDateString()
      if (period === "7d") return d.getTime() >= now.getTime() - 7 * 24 * 3600 * 1000
      if (period === "30d") return d.getTime() >= now.getTime() - 30 * 24 * 3600 * 1000
      return true
    })
  }, [entries, period])

  const total = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered])

  const byProduct = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>()
    filtered.forEach((e) => {
      const cur = map.get(e.productName) || { sum: 0, count: 0 }
      cur.sum += e.amount || 0
      cur.count += 1
      map.set(e.productName, cur)
    })
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.sum - a.sum)
  }, [filtered])

  const maxSum = Math.max(1, ...byProduct.map((p) => p.sum))

  const add = async () => {
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

  const remove = async (id: number) => {
    if (!confirm("Видалити цей запис?")) return
    await fetch("/api/admin/profit", {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Прибуток OZO</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Обери товар, впиши прибуток — все підсумується автоматично.
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

      {/* ── Total ── */}
      <div className="rounded-2xl border bg-slate-900 p-6 text-white text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Прибуток · {PERIODS.find((p) => p.key === period)?.label}
        </p>
        <p className="text-4xl font-black mt-2 text-green-400">
          {Math.round(total).toLocaleString("uk-UA")} ₴
        </p>
        <p className="text-[11px] text-slate-400 mt-1">Записів: {filtered.length}</p>
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

      {/* ── Add form ── */}
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Товар</label>
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
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
            Прибуток (грн)
          </label>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Наприклад: 300"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
            Коментар (не обов'язково)
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Наприклад: продав 3 шт"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={add}
          disabled={busy || !productId || !amount}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl uppercase text-sm tracking-wide transition-colors active:scale-[0.99]"
        >
          {busy ? "Додавання..." : "+ Додати прибуток"}
        </button>
      </div>

      {/* ── Entries ── */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            {entries.length === 0 ? "Ще немає записів. Додай перший вище." : "Немає записів за цей період."}
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.productName}</p>
                  {e.comment ? (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">💬 {e.comment}</p>
                  ) : null}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString("uk-UA", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="font-bold text-green-600 whitespace-nowrap">
                  +{Math.round(e.amount).toLocaleString("uk-UA")} ₴
                </span>
                <button
                  onClick={() => remove(e.id)}
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
