"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type AddonVal = { name: string; val: number }
type ProductItem = { id: number; name: string; buy: number; vol: number; dose: number; sale: number; adds: string[] }
type BundleItem = { id: number; name: string; sale: number; items: number[]; adds: string[] }

const DEFAULT_ADDONS: Record<string, AddonVal> = {
  t1: { name: "Флакон Окси (30мл)", val: 5.0 },
  t2: { name: "Ал. баночка (50мл)", val: 14.19 },
  t3: { name: "Пенная помпа+флакон", val: 16.5 },
  t4: { name: "Флакон Берлин (200мл)", val: 7.75 },
  t5: { name: "Флакон Глория (100мл)", val: 7.7 },
  k1: { name: "Флип-топ 20/410", val: 3.16 },
  k2: { name: "Флип-топ 24/410", val: 2.6 },
  r1: { name: "Губка 9.5см", val: 6.9 },
  r2: { name: "Щетка Horsehaire", val: 75.0 },
  r3: { name: "Фетр 'Монетка'", val: 4.4 },
  r4: { name: "Фетр 'Кружочки'", val: 0.3 },
}

interface PopupState {
  type: "prod" | "bundle"
  idx: number
}

export default function ProfitCalculatorPage() {
  const [addons, setAddons] = useState<Record<string, AddonVal>>({})
  const [products, setProducts] = useState<ProductItem[]>([])
  const [bundles, setBundles] = useState<BundleItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saveDot, setSaveDot] = useState("bg-green-500")
  const [popup, setPopup] = useState<PopupState | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch("/api/admin/calculator")
      .then((r) => r.json())
      .then((data) => {
        if (data.addons) {
          setAddons(data.addons)
        } else {
          setAddons(JSON.parse(JSON.stringify(DEFAULT_ADDONS)))
        }
        setProducts(data.products || [])
        setBundles(data.bundles || [])
      })
      .catch(() => {
        setAddons(JSON.parse(JSON.stringify(DEFAULT_ADDONS)))
      })
      .finally(() => setLoaded(true))
  }, [])

  const save = useCallback(
    (a: Record<string, AddonVal>, p: ProductItem[], b: BundleItem[]) => {
      setSaveDot("bg-orange-500 animate-pulse")
      fetch("/api/admin/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addons: a, products: p, bundles: b }),
      })
        .then((r) => r.json())
        .then(() => setSaveDot("bg-green-500"))
        .catch(() => setSaveDot("bg-red-500"))
    },
    []
  )

  const delayedSave = useCallback(
    (a: Record<string, AddonVal>, p: ProductItem[], b: BundleItem[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSaveDot("bg-orange-500 animate-pulse")
      saveTimer.current = setTimeout(() => save(a, p, b), 800)
    },
    [save]
  )

  const getLiquidOnlyCost = (p: ProductItem) => (p.buy / (p.vol || 1)) * p.dose

  const getProductFullCost = (p: ProductItem) => {
    let addsCost = 0
    p.adds.forEach((aid) => {
      if (addons[aid]) addsCost += addons[aid].val
    })
    return getLiquidOnlyCost(p) + addsCost
  }

  const getBundleCost = (b: BundleItem) => {
    let total = 0
    b.items.forEach((pid) => {
      const prod = products.find((x) => x.id === pid)
      if (prod) total += getLiquidOnlyCost(prod)
    })
    b.adds.forEach((aid) => {
      if (addons[aid]) total += addons[aid].val
    })
    return total
  }

  const handleReset = () => {
    if (!confirm("Сбросить расходники к базовому списку? Данные товаров и наборов не изменятся.")) return
    const a = JSON.parse(JSON.stringify(DEFAULT_ADDONS))
    setAddons(a)
    save(a, products, bundles)
  }

  const updateAddon = (id: string, field: "name" | "val", value: string | number) => {
    const next = { ...addons, [id]: { ...addons[id], [field]: value } }
    setAddons(next)
    delayedSave(next, products, bundles)
  }

  const deleteAddon = (id: string) => {
    const nextAddons = { ...addons }
    delete nextAddons[id]
    const nextProducts = products.map((p) => ({ ...p, adds: p.adds.filter((a) => a !== id) }))
    setAddons(nextAddons)
    setProducts(nextProducts)
    delayedSave(nextAddons, nextProducts, bundles)
  }

  const addNewAddon = () => {
    const id = "a" + Date.now()
    const next = { ...addons, [id]: { name: "Новая позиция", val: 0 } }
    setAddons(next)
    delayedSave(next, products, bundles)
  }

  const updateProduct = (idx: number, field: keyof ProductItem, value: string | number | string[]) => {
    const next = products.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    setProducts(next)
    delayedSave(addons, next, bundles)
  }

  const toggleProductAddon = (idx: number, aid: string) => {
    const p = products[idx]
    const arr = [...p.adds]
    const i = arr.indexOf(aid)
    if (i > -1) arr.splice(i, 1)
    else arr.push(aid)
    updateProduct(idx, "adds", arr)
  }

  const updateBundle = (bIdx: number, field: keyof BundleItem, value: string | number | number[] | string[]) => {
    const next = bundles.map((b, i) => (i === bIdx ? { ...b, [field]: value } : b))
    setBundles(next)
    delayedSave(addons, products, next)
  }

  const removeBundleItem = (bIdx: number, iIdx: number) => {
    const b = bundles[bIdx]
    const items = b.items.filter((_, i) => i !== iIdx)
    updateBundle(bIdx, "items", items)
  }

  const removeBundleAddon = (bIdx: number, aIdx: number) => {
    const b = bundles[bIdx]
    const adds = b.adds.filter((_, i) => i !== aIdx)
    updateBundle(bIdx, "adds", adds)
  }

  const togglePop = (type: "prod" | "bundle", idx: number) => {
    setPopup((prev) => (prev?.type === type && prev.idx === idx ? null : { type, idx }))
  }

  useEffect(() => {
    const click = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest("button") && !t.closest("input") && !t.closest("[data-pop]")) {
        setPopup(null)
      }
    }
    window.addEventListener("click", click)
    return () => window.removeEventListener("click", click)
  }, [])

  let totalProfit = 0
  let totalRev = 0
  let count = 0
  products.forEach((p) => {
    totalProfit += p.sale - getProductFullCost(p)
    totalRev += p.sale
    count++
  })

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm">Загрузка калькулятора...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            OZO Profit <span className="text-blue-600">6.2</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${saveDot} rounded-full`} />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Авто из каталога</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="bg-white text-slate-400 px-5 py-2.5 rounded-2xl border hover:text-red-500 transition text-xs font-bold uppercase"
        >
          🔄 Сбросить расходники
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar — Addons */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">📦 Тара и Расходники</h3>
              <button onClick={addNewAddon} className="bg-blue-600 text-white w-6 h-6 rounded-lg font-black hover:bg-blue-700 transition">
                +
              </button>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {Object.entries(addons).map(([id, item]) => (
                <div key={id} className="group bg-slate-50 p-3 rounded-2xl border border-transparent transition relative">
                  <div className="flex justify-between items-center mb-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateAddon(id, "name", e.target.value)}
                      className="bg-transparent font-bold text-[10px] text-slate-700 outline-none w-full uppercase"
                    />
                    <button onClick={() => deleteAddon(id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 font-black transition">
                      ×
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={item.val}
                      onChange={(e) => updateAddon(id, "val", parseFloat(e.target.value) || 0)}
                      className="bg-white px-2 py-1 rounded-lg text-xs font-mono w-full border border-slate-100 focus:bg-white focus:shadow-[0_0_0_2px_#3b82f6_inset] outline-none"
                    />
                    <span className="text-[9px] font-black text-slate-300">₴</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-9 space-y-8">
          {/* Products — SINGLE type from catalog */}
          <section>
            <h2 className="text-xl font-black text-slate-800 mb-4 px-2">
              Средства и Автохимия
              <span className="text-slate-400 text-xs font-normal ml-2">({products.length} из каталога)</span>
            </h2>
            {products.length === 0 ? (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-10 text-center">
                <p className="text-slate-400 text-sm">Нет товаров с типом «Одиночний». Добавьте товары в каталоге и установите тип «Одиночний».</p>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="p-5">Наименование</th>
                        <th className="p-5 text-center">Закуп (факт)</th>
                        <th className="p-5 text-center">Объем/г</th>
                        <th className="p-5 text-center">Порция</th>
                        <th className="p-5 text-center">Себ.</th>
                        <th className="p-5 text-center">Цена продажи</th>
                        <th className="p-5 text-right">Выгода</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm font-medium">
                      {products.map((p, idx) => {
                        const cost = getProductFullCost(p)
                        const profit = p.sale - cost
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group align-top">
                            <td className="p-5 min-w-[200px] relative">
                              <div className="mb-2">
                                <span className="font-black text-slate-700 text-sm">{p.name}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {p.adds.map((aid) => (
                                  <span key={aid} className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                    {addons[aid]?.name || "..."}
                                  </span>
                                ))}
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePop("prod", idx) }}
                                  className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded hover:bg-blue-600 hover:text-white transition font-black uppercase"
                                >
                                  +
                                </button>
                              </div>
                              {popup?.type === "prod" && popup.idx === idx && (
                                <div data-pop className="absolute left-5 z-50 bg-white border shadow-2xl rounded-2xl p-4 mt-2 w-64 max-h-60 overflow-y-auto">
                                  {Object.entries(addons).map(([aid, a]) => (
                                    <label key={aid} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={p.adds.includes(aid)}
                                        onChange={() => toggleProductAddon(idx, aid)}
                                        className="rounded border-slate-300 text-blue-600"
                                      />
                                      <span className="text-[11px] font-bold text-slate-600">{a.name}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-5 text-center">
                              <input type="number" value={p.buy} onChange={(e) => updateProduct(idx, "buy", parseFloat(e.target.value) || 0)} className="w-20 p-2 bg-slate-50 rounded-xl font-black text-xs text-center text-blue-600 focus:bg-white focus:shadow-[0_0_0_2px_#3b82f6_inset] outline-none" />
                            </td>
                            <td className="p-5 text-center">
                              <input type="number" value={p.vol} onChange={(e) => updateProduct(idx, "vol", parseFloat(e.target.value) || 0)} className="w-16 bg-transparent outline-none text-center font-mono text-xs text-slate-400 focus:bg-white focus:shadow-[0_0_0_2px_#3b82f6_inset]" />
                            </td>
                            <td className="p-5 text-center">
                              <input type="number" value={p.dose} onChange={(e) => updateProduct(idx, "dose", parseFloat(e.target.value) || 0)} className="w-16 p-2 bg-blue-50 text-blue-600 rounded-xl font-black text-center text-xs focus:bg-white focus:shadow-[0_0_0_2px_#3b82f6_inset] outline-none" />
                            </td>
                            <td className="p-5 text-center font-bold text-slate-400 text-xs">{cost.toFixed(1)}</td>
                            <td className="p-5 text-center">
                              <input type="number" value={p.sale} onChange={(e) => updateProduct(idx, "sale", parseFloat(e.target.value) || 0)} className="w-20 p-2 border-b-2 border-blue-100 bg-transparent font-black text-center text-sm focus:border-blue-500 outline-none focus:bg-white" />
                            </td>
                            <td className={`p-5 text-right font-black whitespace-nowrap ${profit > 0 ? "text-green-500" : "text-red-400"}`}>
                              {Math.round(profit)} ₴
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Bundles — BUNDLE type from catalog */}
          <section>
            <div className="flex justify-between items-end mb-4 px-2">
              <h2 className="text-xl font-black text-slate-800">
                Комбо-Наборы
                <span className="text-slate-400 text-xs font-normal ml-2">({bundles.length} из каталога)</span>
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">
                * В наборах тара из позиций химии не учитывается
              </p>
            </div>
            {bundles.length === 0 ? (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-10 text-center">
                <p className="text-slate-400 text-sm">Нет товаров с типом «Набір». Добавьте товары в каталоге и установите тип «Набір».</p>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="p-5">Название набора и состав</th>
                        <th className="p-5 text-center">Себ. набора</th>
                        <th className="p-5 text-center">Цена продажи</th>
                        <th className="p-5 text-right">Выгода</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm font-medium">
                      {bundles.map((b, bIdx) => {
                        const cost = getBundleCost(b)
                        const profit = b.sale - cost
                        return (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="p-5 relative">
                              <div className="mb-3">
                                <span className="font-black text-slate-800 text-base">{b.name}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {b.items.map((pid, iIdx) => {
                                  const p = products.find((x) => x.id === pid)
                                  return (
                                    <span key={`i-${pid}-${iIdx}`} className="bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                      {p?.name || "..."}
                                      <button onClick={() => removeBundleItem(bIdx, iIdx)} className="hover:text-red-200 ml-1">
                                        ×
                                      </button>
                                    </span>
                                  )
                                })}
                                {b.adds.map((aid, aIdx) => (
                                  <span key={`a-${aid}-${aIdx}`} className="bg-slate-800 text-slate-100 text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                    {addons[aid]?.name || "..."}
                                    <button onClick={() => removeBundleAddon(bIdx, aIdx)} className="hover:text-red-400 ml-1">
                                      ×
                                    </button>
                                  </span>
                                ))}
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePop("bundle", bIdx) }}
                                  className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition font-black border border-blue-100"
                                >
                                  + СОСТАВ
                                </button>
                              </div>
                              {popup?.type === "bundle" && popup.idx === bIdx && (
                                <div data-pop className="absolute left-5 z-50 bg-white border shadow-2xl rounded-2xl p-4 mt-2 w-72 max-h-80 overflow-y-auto">
                                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">Добавить химию (без тары):</p>
                                  <div className="space-y-1 mb-4">
                                    {products.map((p) => (
                                      <div
                                        key={p.id}
                                        onClick={() => updateBundle(bIdx, "items", [...b.items, p.id])}
                                        className="text-[11px] p-2 hover:bg-blue-50 rounded-lg cursor-pointer font-bold text-slate-600 flex justify-between items-center"
                                      >
                                        <span>{p.name}</span>
                                        <span className="text-blue-500 text-[10px] font-mono">{getLiquidOnlyCost(p).toFixed(1)}₴</span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-[10px] font-black text-slate-400 mb-2 uppercase">Добавить тару/расходники:</p>
                                  <div className="space-y-1">
                                    {Object.entries(addons).map(([aid, a]) => (
                                      <div
                                        key={aid}
                                        onClick={() => updateBundle(bIdx, "adds", [...b.adds, aid])}
                                        className="text-[11px] p-2 hover:bg-slate-100 rounded-lg cursor-pointer font-bold text-slate-500 flex justify-between items-center"
                                      >
                                        <span>{a.name}</span>
                                        <span className="font-mono text-[10px]">{a.val}₴</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-5 text-center font-black text-slate-500 text-lg">{Math.round(cost)} ₴</td>
                            <td className="p-5 text-center">
                              <input
                                type="number"
                                value={b.sale}
                                onChange={(e) => updateBundle(bIdx, "sale", parseFloat(e.target.value) || 0)}
                                className="w-24 p-3 bg-blue-50 rounded-2xl font-black text-center text-lg text-blue-700 outline-none focus:bg-white"
                              />
                            </td>
                            <td className={`p-5 text-right font-black text-xl whitespace-nowrap ${profit > 0 ? "text-green-500" : "text-red-400"}`}>
                              {Math.round(profit)} ₴
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Summary */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl gap-8">
            <div>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black opacity-60 text-center md:text-left">
                Средняя прибыль (химия)
              </p>
              <p className="text-5xl font-black text-blue-400 mt-2 text-center md:text-left">
                {Math.round(count ? totalProfit / count : 0)} ₴
              </p>
            </div>
            <div className="flex-1 flex justify-around w-full">
              <div className="text-center">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black opacity-60">Маржа</p>
                <p className="text-3xl font-black mt-1 text-green-400">{Math.round(totalRev ? (totalProfit / totalRev) * 100 : 0)}%</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black opacity-60">Оборот</p>
                <p className="text-3xl font-black mt-1">{Math.round(totalRev)} ₴</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
