"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import FinanceCharts from "./charts"

type CalculatorAddon = { name: string; val: number }
type CalculatorProduct = { id: number; name: string; buy: number; vol: number; dose: number; sale: number; adds: string[] }
type CalculatorBundle = { id: number; name: string; sale: number; items: number[]; adds: string[] }
type SaleItem = { type: "product" | "bundle"; itemId: number; qty: number; customPrice: number }
type TransactionType = "sale" | "expense"
type Transaction = {
  id: number
  timestamp: number
  date: string
  type: TransactionType
  status: string
  comment: string
  amount: number
  category: string
  items: SaleItem[]
}
type FinanceSettings = { usdRate: number; targetProfit: number; targetRevenue: number }

const EXPENSE_CATEGORIES = ["Пакування", "Логістика", "Брак", "Реклама", "Інше"]

function toUSD(amount: number, rate: number) {
  return ((amount / (rate || 1))).toFixed(2) + " $"
}

export default function FinanceControlPage() {
  const [loaded, setLoaded] = useState(false)
  const [addons, setAddons] = useState<Record<string, CalculatorAddon>>({})
  const [products, setProducts] = useState<CalculatorProduct[]>([])
  const [bundles, setBundles] = useState<CalculatorBundle[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [settings, setSettings] = useState<FinanceSettings>({ usdRate: 41.5, targetProfit: 30000, targetRevenue: 80000 })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/calculator").then((r) => r.json()),
      fetch("/api/admin/finance").then((r) => r.json()),
    ])
      .then(([calc, fin]) => {
        setAddons(calc.addons || {})
        setProducts(calc.products || [])
        setBundles(calc.bundles || [])
        const raw = (fin.sales || []) as Array<{
          id: number; timestamp: number; date: string; type?: string; status: string; comment: string;
          items?: SaleItem[]; amount?: number; category?: string
        }>
        setTransactions(
          raw.map((s) => ({
            id: s.id,
            timestamp: s.timestamp,
            date: s.date,
            type: (s.type as TransactionType) || "sale",
            status: s.status || "transit",
            comment: s.comment || "",
            amount: s.amount || 0,
            category: s.category || "Інше",
            items: (s.items as SaleItem[]) || [],
          }))
        )
        if (fin.settings) setSettings(fin.settings)
      })
      .finally(() => setLoaded(true))
  }, [])

  const saveFinance = useCallback(
    (tx: Transaction[], stg?: FinanceSettings) => {
      fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales: tx, settings: stg ?? settings }),
      }).catch((err) => console.error("Finance save failed:", err))
    },
    [settings]
  )

  const delayedSave = useCallback(
    (tx: Transaction[], stg?: FinanceSettings) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => saveFinance(tx, stg), 800)
    },
    [saveFinance]
  )

  const getProductFullCost = (p: CalculatorProduct) => {
    let adds = 0
    if (p.adds) p.adds.forEach((id) => { if (addons[id]) adds += addons[id].val })
    return ((p.buy / (p.vol || 1)) * p.dose) + adds
  }

  const getBundleCost = (b: CalculatorBundle) => {
    let total = 0
    if (b.items)
      b.items.forEach((pid) => {
        const p = products.find((x) => x.id === pid)
        if (p) total += ((p.buy / (p.vol || 1)) * p.dose)
      })
    if (b.adds) b.adds.forEach((aid) => { if (addons[aid]) total += addons[aid].val })
    return total
  }

  const updateItem = (tIdx: number, iIdx: number, field: string, value: string | number) => {
    const next = transactions.map((t, ti) => {
      if (ti !== tIdx) return t
      const items = t.items.map((si2, ii) => {
        if (ii !== iIdx) return si2
        const nextValue = field === "qty" || field === "itemId" ? Number(value) : value
        const updated: SaleItem = { ...si2, [field]: nextValue }
        if (field === "type" || field === "itemId") {
          const list = updated.type === "product" ? products : bundles
          const found = list.find((x) => x.id === updated.itemId)
          if (found) updated.customPrice = found.sale
        }
        return updated
      })
      return { ...t, items }
    })
    setTransactions(next)
    delayedSave(next)
  }

  const addNewSale = () => {
    const defaultType = products.length ? "product" : "bundle"
    const item = defaultType === "product" ? products[0] : bundles[0]
    const next: Transaction[] = [
      {
        id: Date.now(),
        timestamp: Date.now(),
        date: new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
        type: "sale",
        status: "transit",
        comment: "",
        amount: 0,
        category: "",
        items: [{ type: defaultType, itemId: item ? item.id : 0, qty: 1, customPrice: item ? item.sale : 0 }],
      },
      ...transactions,
    ]
    setTransactions(next)
    delayedSave(next)
  }

  const addNewExpense = () => {
    const next: Transaction[] = [
      {
        id: Date.now() + 1,
        timestamp: Date.now() + 1,
        date: new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
        type: "expense",
        status: "paid",
        comment: "",
        amount: 0,
        category: EXPENSE_CATEGORIES[0],
        items: [],
      },
      ...transactions,
    ]
    setTransactions(next)
    delayedSave(next)
  }

  const addSubSale = (tIdx: number) => {
    const next = transactions.map((t, ti) => {
      if (ti !== tIdx) return t
      return {
        ...t,
        items: [...t.items, { type: "product" as const, itemId: products[0]?.id || 0, qty: 1, customPrice: products[0]?.sale || 0 }],
      }
    })
    setTransactions(next)
    delayedSave(next)
  }

  const removeTransaction = (tIdx: number) => {
    if (!confirm("Видалити?")) return
    const next = transactions.filter((_, i) => i !== tIdx)
    setTransactions(next)
    delayedSave(next)
  }

  const removeItem = (tIdx: number, iIdx: number) => {
    const next = transactions.map((t, ti) => (ti === tIdx ? { ...t, items: t.items.filter((_, ii) => ii !== iIdx) } : t))
    setTransactions(next)
    delayedSave(next)
  }

  const updateSaleStatus = (tIdx: number, status: string) => {
    const next = transactions.map((t, ti) => (ti === tIdx ? { ...t, status } : t))
    setTransactions(next)
    delayedSave(next)
  }

  const updateComment = (tIdx: number, comment: string) => {
    const next = transactions.map((t, ti) => (ti === tIdx ? { ...t, comment } : t))
    setTransactions(next)
    delayedSave(next)
  }

  const updateExpense = (tIdx: number, field: "amount" | "category" | "date", value: string | number) => {
    const next = transactions.map((t, ti) =>
      ti === tIdx ? { ...t, [field]: field === "amount" ? Number(value) : value } : t
    )
    setTransactions(next)
    delayedSave(next)
  }

  const updateSettings = (key: keyof FinanceSettings, value: number) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    delayedSave(transactions, next)
  }

  const fetchUsdRate = async () => {
    try {
      const res = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json")
      const data = await res.json()
      if (data[0]?.rate) updateSettings("usdRate", parseFloat(data[0].rate.toFixed(2)))
    } catch {
      alert("Помилка API НБУ")
    }
  }

  const clearJournal = () => {
    if (!confirm("Очистити все?")) return
    const next: Transaction[] = []
    setTransactions(next)
    delayedSave(next)
  }

  const exportToExcel = async () => {
    const XLSX = (await import("xlsx")).default
    const data: Record<string, string | number>[] = []
    transactions.forEach((t) => {
      if (t.type === "expense") {
        data.push({
          Дата: t.date,
          Тип: "Витрата",
          Категорія: t.category,
          Сума: -t.amount,
          Коментар: t.comment,
        })
      } else {
        t.items.forEach((si) => {
          const item: CalculatorProduct | CalculatorBundle | undefined =
            si.type === "product" ? products.find((p) => p.id === si.itemId) : bundles.find((b) => b.id === si.itemId)
          data.push({
            Дата: t.date,
            Тип: "Продаж",
            "Обʼєкт": item?.name ?? "",
            "К-сть": si.qty,
            Ціна: si.customPrice,
            Коментар: t.comment,
          })
        })
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Finance")
    XLSX.writeFile(wb, "OZO_Finance.xlsx")
  }

  const updateStock = async (productId: number, newVol: number) => {
    const prev = products.find((p) => p.id === productId)
    if (!prev) return
    setProducts((list) =>
      list.map((p) => (p.id === productId ? { ...p, vol: newVol } : p))
    )
    try {
      const res = await fetch("/api/admin/calculator/product", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, vol: newVol }),
      })
      if (!res.ok) throw new Error()
      toast.success(`«${prev.name}» збережено`)
    } catch {
      setProducts((list) =>
        list.map((p) => (p.id === productId ? { ...p, vol: prev.vol } : p))
      )
      toast.error("Помилка збереження")
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Завантаження журналу...</p>
      </div>
    )
  }

  // -- statistics --
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  let paidCash = 0, paidProfit = 0, transitCash = 0, transitProfit = 0
  let monthRevenueValue = 0, monthProfitValue = 0, totalExpenses = 0
  const stockUsage: Record<number, number> = {}

  transactions.forEach((t) => {
    if (t.type === "expense") {
      totalExpenses += t.amount
      return
    }

    let orderCash = 0
    let orderProfit = 0
    t.items.forEach((si) => {
      const item: CalculatorProduct | CalculatorBundle | undefined =
        si.type === "product" ? products.find((p) => p.id === si.itemId) : bundles.find((b) => b.id === si.itemId)
      const currentPrice = si.customPrice !== undefined ? si.customPrice : (item as { sale: number })?.sale ?? 0
      orderCash += currentPrice * si.qty

      if (!item) return

      const cost = si.type === "product" ? getProductFullCost(item as CalculatorProduct) : getBundleCost(item as CalculatorBundle)
      orderProfit += (currentPrice - cost) * si.qty
      const prods: CalculatorProduct[] =
        si.type === "product"
          ? [item as CalculatorProduct]
          : ((item as CalculatorBundle).items
              ? (item as CalculatorBundle).items.map((id: number) => products.find((p: CalculatorProduct) => p.id === id)).filter(Boolean) as CalculatorProduct[]
              : [])
      prods.forEach((p) => {
        stockUsage[p.id] = (stockUsage[p.id] || 0) + p.dose * si.qty
      })
    })
    if (t.status === "paid") {
      paidCash += orderCash
      paidProfit += orderProfit
      if ((t.timestamp || Date.now()) >= startOfMonth) {
        monthProfitValue += orderProfit
        monthRevenueValue += orderCash
      }
    } else {
      transitCash += orderCash
      transitProfit += orderProfit
    }
  })

  const netProfit = monthProfitValue - totalExpenses

  return (
    <div className="max-w-6xl mx-auto">
      <FinanceCharts />

      <header className="flex justify-between items-end mb-10 mt-10">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-blue-500">OZO Control</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Курс $:</p>
            <input
              type="number"
              step="0.1"
              value={settings.usdRate}
              onChange={(e) => updateSettings("usdRate", parseFloat(e.target.value) || 41.5)}
              className="bg-slate-800 text-blue-400 text-[10px] font-bold w-12 rounded px-1 outline-none border border-slate-700"
            />
            <button onClick={fetchUsdRate} className="text-[9px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-slate-300">
              Оновити НБУ
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition shadow-lg">
            📊 Excel
          </button>
          <button onClick={clearJournal} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition shadow-lg">
            🗑️ Очистити
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-3">
            <button
              onClick={addNewSale}
              className="flex-1 bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black uppercase text-sm shadow-xl transition-all active:scale-95 text-white"
            >
              + Продаж
            </button>
            <button
              onClick={addNewExpense}
              className="flex-1 bg-red-600/80 hover:bg-red-600 py-5 rounded-2xl font-black uppercase text-sm shadow-xl transition-all active:scale-95 text-white"
            >
              + Витрата
            </button>
          </div>

          <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="p-5 w-20">Дата</th>
                    <th className="p-5">Операція та Коментар</th>
                    <th className="p-5 text-right w-32">Підсумок</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {transactions.map((t, tIdx) => {
                    if (t.type === "expense") {
                      return (
                        <tr key={t.id} className="border-b border-red-500/10 bg-red-500/5">
                          <td className="p-5 align-top">
                            <input
                              type="text"
                              value={t.date}
                              onChange={(e) => updateExpense(tIdx, "date", e.target.value)}
                              className="text-[10px] text-slate-400 font-bold italic bg-transparent outline-none w-full"
                            />
                            <button onClick={() => removeTransaction(tIdx)} className="text-slate-700 hover:text-red-500 p-2 border border-slate-700/30 rounded-lg transition-colors mt-4 block">
                              ✕
                            </button>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-[9px] bg-red-600 text-white font-black uppercase px-2 py-0.5 rounded">
                                ВИТРАТА
                              </span>
                              <select
                                value={t.category}
                                onChange={(e) => updateExpense(tIdx, "category", e.target.value)}
                                className="bg-slate-700 text-[9px] uppercase px-2 py-1 rounded text-slate-300 outline-none"
                              >
                                {EXPENSE_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <input
                              type="number"
                              step="any"
                              value={t.amount}
                              onChange={(e) => updateExpense(tIdx, "amount", parseFloat(e.target.value) || 0)}
                              className="w-28 bg-slate-900 border border-red-500/30 rounded-xl text-center py-2 text-red-400 font-black text-lg outline-none mb-2"
                            />
                            <input
                              type="text"
                              placeholder="Нотатка..."
                              value={t.comment || ""}
                              onChange={(e) => updateComment(tIdx, e.target.value)}
                              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg p-2 text-[10px] text-slate-400 outline-none focus:border-blue-500/50"
                            />
                          </td>
                          <td className="p-5 text-right align-top">
                            <div className="text-sm font-black text-red-400">-{Math.round(t.amount)} ₴</div>
                          </td>
                        </tr>
                      )
                    }

                    let orderCash = 0
                    let orderProfit = 0
                    t.items.forEach((si) => {
                      const item: CalculatorProduct | CalculatorBundle | undefined =
                        si.type === "product" ? products.find((p) => p.id === si.itemId) : bundles.find((b) => b.id === si.itemId)
                      orderCash += si.customPrice * si.qty
                      if (!item) return
                      const cost = si.type === "product" ? getProductFullCost(item as CalculatorProduct) : getBundleCost(item as CalculatorBundle)
                      orderProfit += (si.customPrice - cost) * si.qty
                    })

                    return (
                      <tr key={t.id} className={`border-b border-slate-700/30 ${t.status === "paid" ? "bg-green-500/5" : "bg-amber-500/5"}`}>
                        <td className="p-5 align-top">
                          <div className="text-[10px] text-slate-500 font-bold italic mb-4">{t.date}</div>
                          <button onClick={() => removeTransaction(tIdx)} className="text-slate-700 hover:text-red-500 p-2 border border-slate-700/30 rounded-lg transition-colors">
                            ✕
                          </button>
                        </td>
                        <td className="p-5">
                          <div className="flex gap-2 mb-3">
                            <select
                              value={t.status}
                              onChange={(e) => updateSaleStatus(tIdx, e.target.value)}
                              className={`text-[9px] uppercase px-2 py-1 rounded font-black ${t.status === "paid" ? "bg-green-600" : "bg-amber-600"}`}
                            >
                              <option value="transit">🚚 В ДОРОЗІ</option>
                              <option value="paid">✅ ОПЛАЧЕНО</option>
                            </select>
                            <button onClick={() => addSubSale(tIdx)} className="text-[9px] bg-slate-700 px-2 rounded hover:text-blue-400 font-bold uppercase tracking-tighter">
                              + ДОПРОДАЖА
                            </button>
                          </div>

                          {t.items.map((si, iIdx) => {
                            const list = si.type === "product" ? products : bundles
                            return (
                              <div key={iIdx} className="flex items-center gap-2 mb-1.5 bg-slate-900/40 p-2 rounded-lg border border-slate-700/20 text-[10px]">
                                <select
                                  value={si.type}
                                  onChange={(e) => updateItem(tIdx, iIdx, "type", e.target.value)}
                                  className="bg-slate-700 text-[8px] uppercase px-1 rounded text-blue-300 outline-none"
                                >
                                  <option value="product">Товар</option>
                                  <option value="bundle">Набір</option>
                                </select>
                                <select
                                  value={si.itemId}
                                  onChange={(e) => updateItem(tIdx, iIdx, "itemId", e.target.value)}
                                  className="bg-transparent flex-1 outline-none text-white font-medium overflow-hidden w-0 min-w-0"
                                >
                                  {!list.some((x) => x.id === si.itemId) && (
                                    <option value={si.itemId} className="bg-slate-800 text-slate-500">
                                      {si.itemId === 0 ? "— не визначено —" : "— видалено —"}
                                    </option>
                                  )}
                                  {list.map((x) => (
                                    <option key={x.id} value={x.id} className="bg-slate-800">
                                      {x.name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={si.customPrice}
                                  onChange={(e) => updateItem(tIdx, iIdx, "customPrice", parseFloat(e.target.value) || 0)}
                                  className="w-12 bg-slate-800 border border-slate-700 rounded text-center py-1 text-blue-400 font-bold"
                                />
                                <input
                                  type="number"
                                  value={si.qty}
                                  onChange={(e) => updateItem(tIdx, iIdx, "qty", parseInt(e.target.value) || 1)}
                                  className="w-8 bg-slate-700 rounded text-center py-1"
                                />
                                {t.items.length > 1 && (
                                  <button onClick={() => removeItem(tIdx, iIdx)} className="text-slate-600 hover:text-red-400 px-1">
                                    ✕
                                  </button>
                                )}
                              </div>
                            )
                          })}

                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Нотатка..."
                              value={t.comment || ""}
                              onChange={(e) => updateComment(tIdx, e.target.value)}
                              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg p-2 text-[10px] text-slate-400 outline-none focus:border-blue-500/50"
                            />
                          </div>
                        </td>
                        <td className="p-5 text-right align-top">
                          <div className="text-sm font-black text-white">{Math.round(orderCash)} ₴</div>
                          <div className="text-[9px] text-slate-500 italic font-medium mb-1">{toUSD(orderCash, settings.usdRate)}</div>
                          <div className="text-[10px] text-slate-400 font-bold">P: {Math.round(orderProfit)} ₴</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-blue-500/20">
            <h2 className="text-[10px] font-black uppercase mb-6 text-blue-400 tracking-widest text-center italic">Місячні цілі</h2>
            <div className="space-y-10">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Чистий Прибуток</span>
                  <div className="text-[11px] font-bold flex items-center">
                    <span className="text-white">{Math.round(netProfit)}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <input
                      type="number"
                      value={settings.targetProfit}
                      onChange={(e) => updateSettings("targetProfit", parseInt(e.target.value) || 0)}
                      className="bg-transparent text-blue-400 w-16 text-right outline-none"
                    />
                    <span className="text-blue-400 ml-0.5">₴</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="bg-blue-500 h-full transition-all duration-700"
                    style={{ width: Math.min(100, Math.max(0, (netProfit / (settings.targetProfit || 1)) * 100)) + "%" }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                  <div className="text-blue-500">
                    Виконано: <span>{Math.round(Math.max(0, (netProfit / (settings.targetProfit || 1)) * 100)) || 0}</span>%
                  </div>
                  <div className="text-slate-500">
                    Залишилось: <span className="text-slate-300">{Math.max(0, settings.targetProfit - Math.round(netProfit))}</span> ₴
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Загальний Обіг</span>
                  <div className="text-[11px] font-bold flex items-center">
                    <span className="text-white">{Math.round(monthRevenueValue)}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <input
                      type="number"
                      value={settings.targetRevenue}
                      onChange={(e) => updateSettings("targetRevenue", parseInt(e.target.value) || 0)}
                      className="bg-transparent text-emerald-400 w-16 text-right outline-none"
                    />
                    <span className="text-emerald-400 ml-0.5">₴</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-700"
                    style={{ width: Math.min(100, (monthRevenueValue / (settings.targetRevenue || 1)) * 100) + "%" }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                  <div className="text-emerald-500">
                    Виконано: <span>{Math.round((monthRevenueValue / (settings.targetRevenue || 1)) * 100) || 0}</span>%
                  </div>
                  <div className="text-slate-500">
                    Залишилось: <span className="text-slate-300">{Math.max(0, settings.targetRevenue - Math.round(monthRevenueValue))}</span> ₴
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-600/10 border border-red-600/30 p-6 rounded-[2rem]">
            <p className="text-red-500 text-[10px] uppercase font-black mb-3 italic">💸 Витрати</p>
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Всього за місяць: <span className="text-red-400 font-bold">{Math.round(totalExpenses)} ₴</span>
              </p>
            </div>
          </div>

          <div className="bg-amber-600/10 border border-amber-600/30 p-6 rounded-[2rem]">
            <p className="text-amber-500 text-[10px] uppercase font-black mb-3 italic">🚚 В ДОРОЗІ</p>
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Каса: <span className="text-white font-bold">{Math.round(transitCash)} ₴</span>
              </p>
              <p className="text-xs text-slate-400">
                Прибуток: <span className="text-amber-400 font-bold">{Math.round(transitProfit)} ₴</span>
              </p>
            </div>
          </div>

          <div className="bg-green-600/10 border border-green-600/30 p-6 rounded-[2rem]">
            <p className="text-green-500 text-[10px] uppercase font-black mb-3 italic">✅ ОПЛАЧЕНО</p>
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Каса: <span className="text-white font-bold">{Math.round(paidCash)} ₴</span>
              </p>
              <p className="text-xs text-slate-400">
                Прибуток: <span className="text-green-400 font-bold">{Math.round(paidProfit)} ₴</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-blue-500/20">
            <h2 className="text-sm font-black uppercase mb-4 text-blue-400 tracking-widest italic">Залишки складу</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {products.map((p) => {
                const current = p.vol - (stockUsage[p.id] || 0)
                const perc = Math.max(0, (current / (p.vol || 1)) * 100)
                return (
                  <div key={p.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between text-[10px] mb-1 items-center gap-2">
                      <span className="text-slate-400 uppercase font-black truncate">{p.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={p.vol}
                          onChange={(e) => {
                            const v = parseInt(e.target.value)
                            if (Number.isFinite(v) && v >= 0) {
                              setProducts((list) =>
                                list.map((x) => (x.id === p.id ? { ...x, vol: v } : x))
                              )
                            }
                          }}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value)
                            if (Number.isFinite(v) && v >= 0 && v !== p.vol) {
                              updateStock(p.id, v)
                            } else if (!Number.isFinite(v) || v < 0) {
                              setProducts((list) =>
                                list.map((x) => (x.id === p.id ? { ...x, vol: p.vol } : x))
                              )
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = parseInt((e.target as HTMLInputElement).value)
                              if (Number.isFinite(v) && v >= 0 && v !== p.vol) {
                                updateStock(p.id, v)
                              }
                            }
                          }}
                          className={`w-16 bg-slate-800 border border-slate-600 rounded text-center py-0.5 outline-none text-[10px] font-bold ${
                            current < p.dose * 3 ? "text-red-400 animate-pulse" : "text-blue-400"
                          }`}
                        />
                        <span className="text-slate-500 text-[9px]">г</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: perc + "%" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={`text-[9px] ${current < p.dose * 3 ? "text-red-500" : "text-slate-500"}`}>
                        Залишок: {Math.round(current)}г
                      </span>
                      <span className="text-[9px] text-slate-600">{p.dose}г/од</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
