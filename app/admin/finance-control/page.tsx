"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import FinanceCharts from "./charts"

type CalculatorProduct = { id: number; name: string; buy: number; vol: number; dose: number; sale: number; adds: string[] }
type CalculatorBundle = { id: number; name: string; sale: number; items: number[]; adds: string[] }
type SaleItem = { type: "product" | "bundle"; itemId: number; qty: number; customPrice: number }
type TransactionType = "sale" | "expense"
type Transaction = {
  id: number; timestamp: number; date: string; type: TransactionType
  status: string; comment: string; amount: number; category: string; items: SaleItem[]
}
type FinanceSettings = { usdRate: number; targetProfit: number; targetRevenue: number }

const EXPENSE_CATEGORIES = ["Пакування", "Логістика", "Брак", "Реклама", "Інше"]

export default function FinanceControlPage() {
  const [loaded, setLoaded] = useState(false)
  const [products, setProducts] = useState<CalculatorProduct[]>([])
  const [bundles, setBundles] = useState<CalculatorBundle[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settings, setSettings] = useState<FinanceSettings>({ usdRate: 41.5, targetProfit: 30000, targetRevenue: 80000 })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load ──
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/calculator").then((r) => r.json()),
      fetch("/api/admin/finance").then((r) => r.json()),
    ])
      .then(([calc, fin]) => {
        setProducts(calc.products || [])
        setBundles(calc.bundles || [])
        setTransactions((fin.sales || []).map((s: any) => ({ ...s, type: s.type || "sale", amount: s.amount || 0, category: s.category || "Інше", items: s.items || [] })))
        if (fin.settings) setSettings(fin.settings)
      })
      .finally(() => setLoaded(true))
  }, [])

  const saveFinance = useCallback((tx: Transaction[], stg?: FinanceSettings) => {
    fetch("/api/admin/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sales: tx, settings: stg ?? settings }) })
      .catch((err) => console.error("Finance save failed:", err))
  }, [settings])

  const delayedSave = useCallback((tx: Transaction[], stg?: FinanceSettings) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveFinance(tx, stg), 800)
  }, [saveFinance])

  // ── Stats ──
  let paidCash = 0, paidProfit = 0, transitCash = 0
  let totalExpenses = 0
  transactions.forEach((t) => {
    if (t.type === "expense") { totalExpenses += t.amount; return }
    let orderCash = 0
    t.items.forEach((si) => orderCash += si.customPrice * si.qty)
    if (t.status === "paid") paidCash += orderCash
    else transitCash += orderCash
  })
  const totalRevenue = paidCash + transitCash

  // ── Actions ──
  const addSale = () => {
    const item = products[0] ?? bundles[0]
    const next: Transaction[] = [{
      id: Date.now(), timestamp: Date.now(), date: new Date().toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", timeZone: "Europe/Kyiv" }),
      type: "sale", status: "transit", comment: "", amount: 0, category: "",
      items: [{ type: "product", itemId: item?.id ?? 0, qty: 1, customPrice: item?.sale ?? 0 }],
    }, ...transactions]
    setTransactions(next); delayedSave(next)
  }

  const addExpense = () => {
    const next: Transaction[] = [{
      id: Date.now()+1, timestamp: Date.now()+1, date: new Date().toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", timeZone: "Europe/Kyiv" }),
      type: "expense", status: "paid", comment: "", amount: 0, category: EXPENSE_CATEGORIES[0], items: [],
    }, ...transactions]
    setTransactions(next); delayedSave(next)
  }

  const removeTx = (idx: number) => {
    if (!confirm("Видалити?")) return
    const next = transactions.filter((_, i) => i !== idx)
    setTransactions(next); delayedSave(next)
  }

  const updateTx = (idx: number, patch: Partial<Transaction>) => {
    const next = transactions.map((t, i) => i === idx ? { ...t, ...patch } : t)
    setTransactions(next); delayedSave(next)
  }

  const addSubItem = (txIdx: number) => {
    const next = transactions.map((t, i) => i === txIdx ? { ...t, items: [...t.items, { type: "product" as const, itemId: products[0]?.id ?? 0, qty: 1, customPrice: products[0]?.sale ?? 0 }] } : t)
    setTransactions(next); delayedSave(next)
  }

  const removeItem = (txIdx: number, iIdx: number) => {
    const next = transactions.map((t, i) => i === txIdx ? { ...t, items: t.items.filter((_, ii) => ii !== iIdx) } : t)
    setTransactions(next); delayedSave(next)
  }

  const updateItem = (txIdx: number, iIdx: number, patch: Partial<SaleItem>) => {
    const next = transactions.map((t, i) => i === txIdx ? { ...t, items: t.items.map((si, j) => j === iIdx ? { ...si, ...patch } : si) } : t)
    setTransactions(next); delayedSave(next)
  }

  const updateSetting = (k: keyof FinanceSettings, v: number) => {
    const next = { ...settings, [k]: v }
    setSettings(next); delayedSave(transactions, next)
  }

  const clearAll = () => {
    if (!confirm("Очистити все?")) return
    setTransactions([]); delayedSave([])
  }

  const exportXls = async () => {
    const XLSX = (await import("xlsx")).default
    const rows: Record<string,any>[] = []
    transactions.forEach(t => {
      if (t.type === "expense") rows.push({ Дата: t.date, Тип: "Витрата", Категорія: t.category, Сума: -t.amount, Коментар: t.comment })
      else t.items.forEach(si => {
        const prod = si.type === "product" ? products.find(p => p.id === si.itemId) : bundles.find(b => b.id === si.itemId)
        rows.push({ Дата: t.date, Тип: "Продаж", Товар: prod?.name ?? "", "К-сть": si.qty, Ціна: si.customPrice, Коментар: t.comment })
      })
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Фінанси")
    XLSX.writeFile(wb, "OZO_Фінанси.xlsx")
  }

  if (!loaded) return <div className="flex items-center justify-center py-20"><p className="text-slate-400 text-sm">Завантаження...</p></div>

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ═══ Charts ═══ */}
      <FinanceCharts />

      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Фінанси OZO</h1>
          <p className="text-xs text-muted-foreground mt-1">Журнал продажів та витрат</p>
        </div>
      </div>

      {/* ═══ Summary cards ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Виторг", value: `${Math.round(totalRevenue).toLocaleString("uk-UA")} ₴`, sub: "", color: "text-blue-600" },
          { label: "Витрати", value: `${Math.round(totalExpenses).toLocaleString("uk-UA")} ₴`, sub: "", color: "text-red-500" },
          { label: "Оплачено", value: `${Math.round(paidCash).toLocaleString("uk-UA")} ₴`, sub: "", color: "text-green-600" },
          { label: "В дорозі", value: `${Math.round(transitCash).toLocaleString("uk-UA")} ₴`, sub: "", color: "text-amber-600" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            {c.sub ? <p className="text-[11px] text-muted-foreground mt-0.5">{c.sub}</p> : null}
          </div>
        ))}
      </div>

      {/* ═══ Monthly targets ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { k: "targetProfit" as const, label: "Ціль — прибуток", color: "bg-blue-500", text: "text-blue-600", value: totalRevenue - totalExpenses },
          { k: "targetRevenue" as const, label: "Ціль — виторг", color: "bg-emerald-500", text: "text-emerald-600", value: totalRevenue },
        ].map(t => {
          const pct = Math.min(100, Math.max(0, (t.value / (settings[t.k] || 1)) * 100))
          return (
            <div key={t.k} className="rounded-2xl border bg-white p-4 space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{t.label}</span>
                <div className="flex items-baseline gap-1 text-xs font-bold">
                  <span>{Math.round(t.value).toLocaleString("uk-UA")}</span>
                  <span className="text-muted-foreground">/</span>
                  <input type="number" value={settings[t.k]} onChange={e => updateSetting(t.k, parseInt(e.target.value) || 0)}
                    className={`bg-transparent w-16 text-right outline-none font-bold ${t.text}`} />
                  <span className={t.text}>₴</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className={`${t.color} h-full transition-all duration-500`} style={{ width: pct + "%" }} />
              </div>
              <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                <span className={t.text}>Виконано: {Math.round(pct)}%</span>
                <span>Залишилось: {Math.max(0, settings[t.k] - Math.round(t.value)).toLocaleString("uk-UA")} ₴</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ Actions ═══ */}
      <div className="flex flex-wrap gap-3">
        <button onClick={addSale} className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold uppercase text-sm text-white transition-all active:scale-95">+ Продаж</button>
        <button onClick={addExpense} className="flex-1 min-w-[120px] bg-red-500 hover:bg-red-400 py-4 rounded-xl font-bold uppercase text-sm text-white transition-all active:scale-95">+ Витрата</button>
        <button onClick={exportXls} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-4 px-5 rounded-xl transition active:scale-95">📊 Excel</button>
        <button onClick={clearAll} className="bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-bold py-4 px-5 rounded-xl transition active:scale-95">🗑 Очистити</button>
      </div>

      {/* ═══ Transactions table ═══ */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 border-b text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-4 w-16">Дата</th>
                <th className="p-4">Операція</th>
                <th className="p-4 text-right w-28">Сума</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((t, idx) => t.type === "expense" ? (
                <tr key={t.id} className="bg-red-50/30">
                  <td className="p-4 align-top">
                    <input type="text" value={t.date} onChange={e => updateTx(idx, { date: e.target.value })}
                      className="text-[10px] text-slate-400 font-bold bg-transparent outline-none w-full" />
                    <button onClick={() => removeTx(idx)} className="text-slate-400 hover:text-red-500 text-xs mt-2 block">✕</button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] bg-red-500 text-white font-bold uppercase px-2 py-0.5 rounded">Витрата</span>
                      <select value={t.category} onChange={e => updateTx(idx, { category: e.target.value })}
                        className="bg-slate-100 text-[10px] uppercase px-2 py-1 rounded outline-none border">
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <input type="number" step="any" value={t.amount} onChange={e => updateTx(idx, { amount: parseFloat(e.target.value) || 0 })}
                      className="w-32 border rounded-lg text-center py-2 text-red-600 font-bold text-sm outline-none mb-2" />
                    <input type="text" placeholder="Нотатка..." value={t.comment || ""} onChange={e => updateTx(idx, { comment: e.target.value })}
                      className="w-full bg-slate-50 rounded-lg p-2 text-[10px] outline-none border" />
                  </td>
                  <td className="p-4 text-right align-top font-bold text-red-500">−{Math.round(t.amount)} ₴</td>
                </tr>
              ) : (
                <tr key={t.id} className={t.status === "paid" ? "bg-green-50/30" : "bg-amber-50/30"}>
                  <td className="p-4 align-top">
                    <div className="text-[10px] text-slate-500 font-bold mb-4">{t.date}</div>
                    <button onClick={() => removeTx(idx)} className="text-slate-400 hover:text-red-500 text-xs">✕</button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 mb-2">
                      <select value={t.status} onChange={e => updateTx(idx, { status: e.target.value })}
                        className={`text-[9px] uppercase px-2 py-1 rounded font-bold text-white ${t.status === "paid" ? "bg-green-600" : "bg-amber-600"}`}>
                        <option value="transit">🚚 В дорозі</option>
                        <option value="paid">✅ Оплачено</option>
                      </select>
                      <button onClick={() => addSubItem(idx)} className="text-[9px] bg-slate-100 px-2 rounded hover:bg-blue-100 font-bold uppercase">+ Додати</button>
                    </div>
                    {t.items.map((si, iIdx) => {
                      const list = si.type === "product" ? products : bundles
                      return (
                        <div key={iIdx} className="flex items-center gap-2 mb-1 bg-slate-50 p-2 rounded-lg border text-[10px]">
                          <select value={si.type} onChange={e => updateItem(idx, iIdx, { type: e.target.value as any })}
                            className="bg-white border text-[9px] uppercase px-1 rounded outline-none">
                            <option value="product">Товар</option>
                            <option value="bundle">Набір</option>
                          </select>
                          <select value={si.itemId} onChange={e => updateItem(idx, iIdx, { itemId: parseInt(e.target.value) })}
                            className="bg-transparent flex-1 outline-none font-medium">
                            {list.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                          </select>
                          <input type="number" value={si.customPrice} onChange={e => updateItem(idx, iIdx, { customPrice: parseFloat(e.target.value) || 0 })}
                            className="w-14 border rounded text-center py-1 text-blue-600 font-bold" />
                          <input type="number" value={si.qty} onChange={e => updateItem(idx, iIdx, { qty: parseInt(e.target.value) || 1 })}
                            className="w-8 border rounded text-center py-1" />
                          {t.items.length > 1 && <button onClick={() => removeItem(idx, iIdx)} className="text-slate-400 hover:text-red-500">✕</button>}
                        </div>
                      )
                    })}
                    <input type="text" placeholder="Нотатка..." value={t.comment || ""} onChange={e => updateTx(idx, { comment: e.target.value })}
                      className="w-full bg-slate-50 rounded-lg p-2 text-[10px] outline-none border mt-2" />
                  </td>
                  <td className="p-4 text-right align-top">
                    <div className="font-bold">{Math.round(t.items.reduce((s, si) => s + si.customPrice * si.qty, 0))} ₴</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">Немає записів. Натисніть «+ Продаж» або «+ Витрата» щоб додати.</div>
        )}
      </div>
    </div>
  )
}
