"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Star, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, ExternalLink, BarChart3, Plus, X, Save, Trash2, Target, DollarSign, Activity } from "lucide-react"
import { toast } from "sonner"

type Trade = {
  id: number; pairId: number; direction: string; entryPrice: number; exitPrice: number | null
  sl: number | null; tp: number | null; lots: number; pnl: number | null; result: string
  setup: string | null; screenshot: string | null; emotions: string | null; notes: string | null
  enteredAt: string; exitedAt: string | null
}

type Pair = {
  id: number; symbol: string; name: string | null; groupName: string
  chartStatus: string; priority: number; notes: string | null; tags: string[]
  bias: string; support: number | null; resistance: number | null; tvLink: string | null
  dailyNotes: string | null; dailyNotesDate: string | null; sessions: string[]
  trades: Trade[]
}

type FtmoConfig = {
  id: number; accountSize: number; dailyLossLimit: number; totalLossLimit: number
  profitTarget: number; currentBalance: number; phase: string
} | null

const STATUS_OPTIONS = [
  { value: "UNCLEAR", label: "❓ Неясно", bg: "#fef3c7", fg: "#92400e" },
  { value: "WATCHING", label: "👀 Дивлюсь", bg: "#dbeafe", fg: "#1e40af" },
  { value: "CLEAR", label: "✅ Ясно", bg: "#d1fae5", fg: "#065f46" },
  { value: "TRADE", label: "🔥 В роботі", bg: "#fee2e2", fg: "#991b1b" },
]

const SESSIONS = [
  { key: "asia", label: "🌏 Азія", hours: "02:00–11:00" },
  { key: "london", label: "🇬🇧 Лондон", hours: "10:00–19:00" },
  { key: "ny", label: "🇺🇸 Нью-Йорк", hours: "15:00–24:00" },
]

function getActiveSession(): string | null {
  const now = new Date()
  const h = now.getUTCHours() + now.getUTCMinutes() / 60
  if (h >= 2 && h < 11) return "asia"
  if (h >= 10 && h < 19) return "london"
  if (h >= 15 || h < 2) return "ny"
  return null
}

export default function TradingPage() {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [config, setConfig] = useState<FtmoConfig>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [sessionFilter, setSessionFilter] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [expandedPair, setExpandedPair] = useState<number | null>(null)
  const [tab, setTab] = useState<"pairs" | "stats" | "ftmo">("pairs")

  // Trade form
  const [showTradeForm, setShowTradeForm] = useState<number | null>(null)
  const [tradeForm, setTradeForm] = useState({
    direction: "LONG", entryPrice: "", sl: "", tp: "", lots: "1", setup: "", emotions: "", notes: "",
  })

  // Edit pair form
  const [editDailyNotes, setEditDailyNotes] = useState("")
  const [editBias, setEditBias] = useState("")
  const [editSupport, setEditSupport] = useState("")
  const [editResistance, setEditResistance] = useState("")
  const [editTvLink, setEditTvLink] = useState("")

  async function load(showToast = false) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/trading")
      const data = await res.json()
      const list = data.pairs ?? []
      if (list.length === 0) {
        await fetch("/api/admin/trading/seed", { method: "POST" })
        const r2 = await fetch("/api/admin/trading")
        const d2 = await r2.json()
        setPairs(d2.pairs ?? [])
        setConfig(d2.config)
        if (showToast) toast.success("167 пар завантажено")
      } else {
        setPairs(list)
        setConfig(data.config)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load(true) }, [])

  async function updatePair(id: number, fields: Record<string, any>) {
    await fetch("/api/admin/trading", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    })
    load()
  }

  async function saveDailyNotes(id: number) {
    await updatePair(id, {
      bias: editBias,
      support: editSupport,
      resistance: editResistance,
      tvLink: editTvLink,
      dailyNotes: editDailyNotes,
    })
    setExpandedPair(null)
    toast.success("Аналіз збережено")
  }

  async function resetDaily(id: number) {
    await updatePair(id, { dailyNotes: "", bias: "NEUTRAL", support: null, resistance: null, tvLink: null })
    toast.success("Скинуто")
  }

  async function toggleSession(pairId: number, currentSessions: string[], session: string) {
    const updated = currentSessions.includes(session)
      ? currentSessions.filter(s => s !== session)
      : [...currentSessions, session]
    await updatePair(pairId, { sessions: updated })
  }

  async function addTrade(pairId: number) {
    if (!tradeForm.entryPrice) { toast.error("Введи ціну входу"); return }
    await fetch("/api/admin/trading/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairId, direction: tradeForm.direction, entryPrice: Number(tradeForm.entryPrice),
        sl: tradeForm.sl ? Number(tradeForm.sl) : null, tp: tradeForm.tp ? Number(tradeForm.tp) : null,
        lots: Number(tradeForm.lots), setup: tradeForm.setup, emotions: tradeForm.emotions, notes: tradeForm.notes,
      }),
    })
    setShowTradeForm(null)
    setTradeForm({ direction: "LONG", entryPrice: "", sl: "", tp: "", lots: "1", setup: "", emotions: "", notes: "" })
    load()
    toast.success("Угоду відкрито")
  }

  async function closeTrade(tradeId: number, result: string, exitPrice: string) {
    if (!exitPrice) { toast.error("Введи ціну виходу"); return }

    const trade = pairs.flatMap(p => p.trades).find(t => t.id === tradeId)
    if (!trade) return

    const entry = trade.entryPrice
    const exit = Number(exitPrice)
    const diff = trade.direction === "LONG" ? exit - entry : entry - exit
    const pnl = (diff / entry) * (trade.lots * 100)

    await fetch("/api/admin/trading/trades", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: tradeId, result, exitPrice: exit, pnl: Math.round(pnl * 100) / 100, exitedAt: new Date().toISOString(),
      }),
    })
    load()
    toast.success(`Угоду закрито: ${result}`)
  }

  async function deleteTrade(id: number) {
    if (!confirm("Видалити угоду?")) return
    await fetch("/api/admin/trading/trades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    load()
  }

  async function saveFtmo(fields: Record<string, any>) {
    await fetch("/api/admin/trading/ftmo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    })
    const r = await fetch("/api/admin/trading")
    const d = await r.json()
    setConfig(d.config)
    toast.success("FTMO збережено")
  }

  // Stats
  const allTrades = pairs.flatMap(p => p.trades)
  const closedTrades = allTrades.filter(t => t.result !== "OPEN")
  const wins = closedTrades.filter(t => t.result === "WIN").length
  const losses = closedTrades.filter(t => t.result === "LOSS").length
  const bes = closedTrades.filter(t => t.result === "BE").length
  const winRate = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const totalWins = closedTrades.filter(t => t.pnl && t.pnl > 0).reduce((s, t) => s + (t.pnl || 0), 0)
  const totalLosses = closedTrades.filter(t => t.pnl && t.pnl < 0).reduce((s, t) => s + (t.pnl || 0), 0)
  const profitFactor = totalLosses !== 0 ? Math.abs(totalWins / totalLosses) : totalWins > 0 ? 999 : 0

  // FTMO bars
  const accountSize = config?.accountSize || 100000
  const currentBalance = config?.currentBalance || accountSize
  const dailyLossLimit = config?.dailyLossLimit || 5
  const profitTarget = config?.profitTarget || 10
  const totalPnLPercent = ((currentBalance - accountSize) / accountSize) * 100

  // Group pairs
  const groupOrder = ["Forex","Cash CFD","Cash II CFD","Metals CFD","Crypto CFD","Exotics","Equities I CFD","Equities II CFD","Agriculture","Commodities","Cash III CFD","Crypto I CFD","Crypto II CFD"]
  const grouped: Record<string, Pair[]> = {}
  for (const g of groupOrder) grouped[g] = []
  for (const p of pairs) {
    if (search && !p.symbol.toLowerCase().includes(search.toLowerCase())) continue
    if (filter !== "ALL" && p.chartStatus !== filter) continue
    if (sessionFilter && (!p.sessions || !p.sessions.includes(sessionFilter))) continue
    const g = p.groupName || "Без групи"
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(p)
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Завантаження...</div>

  // ═══════ STATS TAB ═══════
  if (tab === "stats") {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div><h2 className="text-3xl font-bold tracking-tight">Статистика</h2></div>
          <Button variant="outline" onClick={() => setTab("pairs")}>← Пари</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Всього угод", value: closedTrades.length, color: "bg-card" },
            { label: "Win rate", value: `${winRate}%`, color: winRate >= 50 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700" },
            { label: "Profit Factor", value: profitFactor.toFixed(2), color: profitFactor >= 1.5 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700" },
            { label: "Total P&L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(0)}`, color: totalPnl >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700" },
          ].map((s, i) => (
            <div key={i} className={`rounded-2xl p-5 border ${s.color} border-border`}>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</div>
              <div className="text-2xl font-black">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-2xl border p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">✅ Перемоги</div>
            <div className="text-xl font-black text-emerald-600">{wins}</div>
          </div>
          <div className="bg-card rounded-2xl border p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">❌ Поразки</div>
            <div className="text-xl font-black text-red-600">{losses}</div>
          </div>
          <div className="bg-card rounded-2xl border p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">➖ BE</div>
            <div className="text-xl font-black text-muted-foreground">{bes}</div>
          </div>
          <div className="bg-card rounded-2xl border p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">📋 Відкриті</div>
            <div className="text-xl font-black text-blue-600">{allTrades.filter(t => t.result === "OPEN").length}</div>
          </div>
        </div>

        {/* Per-pair stats */}
        <div className="bg-card rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b bg-[#F9F9F7] text-[11px] font-bold uppercase text-muted-foreground text-left">
              <th className="p-3">Пара</th><th className="p-3">Угод</th><th className="p-3">Win Rate</th><th className="p-3">P&L</th>
            </tr></thead>
            <tbody className="divide-y">
              {pairs.filter(p => p.trades.length > 0).sort((a, b) => b.trades.length - a.trades.length).map(p => {
                const t = p.trades.filter(t => t.result !== "OPEN")
                const w = t.filter(t => t.result === "WIN").length
                const wr = t.length > 0 ? Math.round((w / t.length) * 100) : 0
                const pnl = t.reduce((s, t) => s + (t.pnl || 0), 0)
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono font-bold text-sm">{p.symbol}</td>
                    <td className="p-3 text-sm">{t.length}</td>
                    <td className="p-3 text-sm font-bold" style={{ color: wr >= 50 ? "#059669" : "#dc2626" }}>{wr}%</td>
                    <td className="p-3 text-sm font-bold" style={{ color: pnl >= 0 ? "#059669" : "#dc2626" }}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ═══════ FTMO TAB ═══════
  if (tab === "ftmo") {
    const dailyPnl = totalPnl // use all-time for now
    const dailyLoss = -(dailyLossLimit / 100) * accountSize
    const target = (profitTarget / 100) * accountSize
    const dailyLossPercent = dailyPnl < 0 ? Math.abs(dailyPnl / accountSize) * 100 : 0
    const profitPercent = dailyPnl > 0 ? (dailyPnl / accountSize) * 100 : 0

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div><h2 className="text-3xl font-bold tracking-tight">FTMO</h2></div>
          <Button variant="outline" onClick={() => setTab("pairs")}>← Пари</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border p-5 space-y-3" onDoubleClick={() => {
            const newBalance = prompt("Поточний баланс ($)", String(currentBalance))
            if (newBalance) saveFtmo({ currentBalance: Number(newBalance) })
          }}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Рахунок</p>
            <div className="text-2xl font-black">${currentBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Розмір: ${accountSize.toLocaleString()} | {config?.phase}</p>
          </div>

          <div className="bg-card rounded-2xl border p-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Daily Loss ({dailyLossLimit}%)</span>
              <span className={dailyLossPercent > dailyLossLimit * 0.7 ? "text-red-500" : ""}>{dailyLossPercent.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-secondary rounded-full overflow-hidden">
              <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (dailyLossPercent / dailyLossLimit) * 100)}%`, background: dailyLossPercent > dailyLossLimit * 0.7 ? "#ef4444" : "#10b981" }} />
            </div>
            <p className="text-[10px] text-muted-foreground">Ліміт: {dailyLoss.toFixed(0)} $</p>
          </div>

          <div className="bg-card rounded-2xl border p-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Profit Target ({profitTarget}%)</span>
              <span className="text-emerald-600">{profitPercent.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (profitPercent / profitTarget) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">Ціль: +{target.toFixed(0)} $</p>
          </div>
        </div>

        {/* Quick edit */}
        <div className="bg-card rounded-2xl border p-5 space-y-3">
          <p className="font-bold text-sm">Налаштування FTMO</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Розмір рахунку", key: "accountSize", val: config?.accountSize || 100000 },
              { label: "Daily Loss %", key: "dailyLossLimit", val: config?.dailyLossLimit || 5 },
              { label: "Profit Target %", key: "profitTarget", val: config?.profitTarget || 10 },
              { label: "Баланс зараз", key: "currentBalance", val: config?.currentBalance || 100000 },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">{f.label}</label>
                <Input type="number" defaultValue={f.val} onBlur={e => saveFtmo({ [f.key]: Number(e.target.value) })} className="text-sm" />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Фаза</label>
              <select defaultValue={config?.phase || "Challenge"} onChange={e => saveFtmo({ phase: e.target.value })} className="w-full h-10 rounded-md border px-3 text-sm">
                <option value="Challenge">Challenge</option>
                <option value="Verification">Verification</option>
                <option value="Funded">Funded</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border overflow-hidden">
          <div className="p-5 border-b"><p className="font-bold text-sm">Останні угоди</p></div>
          <table className="w-full">
            <thead><tr className="border-b bg-[#F9F9F7] text-[11px] font-bold uppercase text-muted-foreground text-left">
              <th className="p-3">Пара</th><th className="p-3">Напрямок</th><th className="p-3">Вхід</th><th className="p-3">Вихід</th><th className="p-3">Результат</th><th className="p-3">P&L</th>
            </tr></thead>
            <tbody className="divide-y">
              {allTrades.slice(0, 20).map(t => {
                const pair = pairs.find(p => p.id === t.pairId)
                return (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono text-sm font-bold">{pair?.symbol || "—"}</td>
                    <td className="p-3 text-sm" style={{ color: t.direction === "LONG" ? "#059669" : "#dc2626" }}>{t.direction === "LONG" ? "⬆ Long" : "⬇ Short"}</td>
                    <td className="p-3 text-sm font-mono">{t.entryPrice}</td>
                    <td className="p-3 text-sm font-mono">{t.exitPrice || "—"}</td>
                    <td className="p-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: t.result === "WIN" ? "#d1fae5" : t.result === "LOSS" ? "#fee2e2" : t.result === "BE" ? "#fef3c7" : "#dbeafe", color: t.result === "WIN" ? "#065f46" : t.result === "LOSS" ? "#991b1b" : t.result === "BE" ? "#92400e" : "#1e40af" }}>{t.result}</span></td>
                    <td className="p-3 text-sm font-bold" style={{ color: (t.pnl || 0) >= 0 ? "#059669" : "#dc2626" }}>{(t.pnl || 0) >= 0 ? "+" : ""}${t.pnl?.toFixed(2) || "0.00"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ═══════ PAIRS TAB ═══════
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Трейдинг</h2>
          <p className="text-sm text-muted-foreground mt-1">{pairs.length} пар</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTab("stats")}><BarChart3 size={14} className="mr-1" /> Статистика</Button>
          <Button variant="outline" size="sm" onClick={() => setTab("ftmo")}><Target size={14} className="mr-1" /> FTMO</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." className="max-w-[180px]" />
        {[{value:"ALL",label:"Всі"},{value:"UNCLEAR",label:"❓"},{value:"WATCHING",label:"👀"},{value:"CLEAR",label:"✅"},{value:"TRADE",label:"🔥"}].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f.value ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
            {f.label}
          </button>
        ))}
        <span className="text-muted-foreground mx-1">|</span>
        {SESSIONS.map(s => (
          <button key={s.key} onClick={() => setSessionFilter(sessionFilter === s.key ? null : s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${sessionFilter === s.key ? "bg-[#00B5D1] text-white" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
            {s.label} {getActiveSession() === s.key ? "🔥" : ""}
          </button>
        ))}
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {Object.entries(grouped)
          .filter(([_, items]) => items.length > 0)
          .sort(([a], [b]) => {
            const ai = groupOrder.indexOf(a), bi = groupOrder.indexOf(b)
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
          })
          .map(([group, items]) => {
            const isCollapsed = collapsed[group] ?? false
            return (
              <div key={group} className="bg-card rounded-2xl border overflow-hidden">
                <button onClick={() => setCollapsed(p => ({ ...p, [group]: !p[group] }))}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-[#F9F9F7] hover:bg-muted/50 transition-colors">
                  {isCollapsed ? <ChevronRight size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  <span className="font-bold text-sm">{group}</span>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </button>
                {!isCollapsed && (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-[#F9F9F7] text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-left">
                        <th className="p-2">Пара</th>
                        <th className="p-2 w-[90px]">Пріор.</th>
                        <th className="p-2 w-[60px]">Bias</th>
                        <th className="p-2 w-[130px]">Статус</th>
                        <th className="p-2">Аналіз</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map(p => {
                        const openTrades = p.trades.filter(t => t.result === "OPEN").length
                        return (
                          <tr key={p.id} className={`hover:bg-muted/30 transition-colors text-xs ${p.chartStatus === "TRADE" ? "bg-red-50/30" : p.priority >= 4 ? "bg-yellow-50/20" : ""}`}>
                            <td className="p-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold font-mono">{p.symbol}</span>
                                {p.tvLink && (
                                  <a href={p.tvLink} target="_blank" className="text-[#00B5D1] hover:underline"><ExternalLink size={10} /></a>
                                )}
                                {openTrades > 0 && <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{openTrades}</span>}
                              </div>
                              {p.sessions?.length > 0 && (
                                <div className="flex gap-1 mt-0.5">
                                  {p.sessions.map(s => <span key={s} className="text-[9px] opacity-40">{SESSIONS.find(x => x.key === s)?.label.split(" ")[0]}</span>)}
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(st => (
                                  <button key={st} onClick={() => updatePair(p.id, { priority: p.priority === st ? 0 : st })}
                                    className="transition-all" style={{ color: st <= p.priority ? ["","#ef4444","#f97316","#f59e0b","#eab308","#10b981"][p.priority] || "#f59e0b" : "#d1d5db" }}>
                                    <Star size={13} fill={st <= p.priority ? "currentColor" : "none"} />
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-2">
                              <button onClick={() => { editBias(p.id); }} className="text-lg">
                                {p.bias === "BULLISH" ? <TrendingUp size={18} className="text-emerald-500" /> : p.bias === "BEARISH" ? <TrendingDown size={18} className="text-red-500" /> : <Minus size={18} className="text-muted-foreground/40" />}
                              </button>
                            </td>
                            <td className="p-2">
                              <select value={p.chartStatus} onChange={e => updatePair(p.id, { chartStatus: e.target.value })}
                                className="text-[10px] font-bold px-2 py-1 rounded-full border-0 outline-none"
                                style={{ background: STATUS_OPTIONS.find(s => s.value === p.chartStatus)?.bg, color: STATUS_OPTIONS.find(s => s.value === p.chartStatus)?.fg }}>
                                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </td>
                            <td className="p-2">
                              {expandedPair === p.id ? (
                                <div className="space-y-2 py-1">
                                  <div className="flex gap-2 flex-wrap items-center">
                                    <button onClick={() => updatePair(p.id, { bias: "BULLISH" })} className={`px-2 py-1 rounded text-[10px] font-bold ${p.bias === "BULLISH" ? "bg-emerald-100 text-emerald-700" : "bg-secondary"}`}>🟢 Long</button>
                                    <button onClick={() => updatePair(p.id, { bias: "BEARISH" })} className={`px-2 py-1 rounded text-[10px] font-bold ${p.bias === "BEARISH" ? "bg-red-100 text-red-700" : "bg-secondary"}`}>🔴 Short</button>
                                    <button onClick={() => updatePair(p.id, { bias: "NEUTRAL" })} className={`px-2 py-1 rounded text-[10px] font-bold ${p.bias === "NEUTRAL" ? "bg-muted" : "bg-secondary"}`}>⚪ Neutral</button>
                                  </div>
                                  <div className="flex gap-2 flex-wrap text-[10px]">
                                    {SESSIONS.map(s => (
                                      <button key={s.key} onClick={() => toggleSession(p.id, p.sessions || [], s.key)}
                                        className={`px-2 py-1 rounded-full font-bold ${(p.sessions || []).includes(s.key) ? "bg-[#00B5D1]/20 text-[#00B5D1]" : "bg-secondary text-muted-foreground"}`}>
                                        {s.label} {s.hours}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input placeholder="Підтримка" value={editSupport} onChange={e => setEditSupport(e.target.value)} className="text-xs h-8 w-28" />
                                    <Input placeholder="Опір" value={editResistance} onChange={e => setEditResistance(e.target.value)} className="text-xs h-8 w-28" />
                                    <Input placeholder="TV лінк" value={editTvLink} onChange={e => setEditTvLink(e.target.value)} className="text-xs h-8 flex-1" />
                                  </div>
                                  <textarea value={editDailyNotes} onChange={e => setEditDailyNotes(e.target.value)} placeholder="Нотатки на сьогодні..." className="w-full text-xs rounded-md border px-2 py-1.5 h-16 resize-y" />
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={() => saveDailyNotes(p.id)}><Save size={12} className="mr-1" /> Зберегти</Button>
                                    <Button size="sm" variant="outline" onClick={() => resetDaily(p.id)}>Скинути</Button>
                                    <Button size="sm" variant="outline" onClick={() => { setExpandedPair(null); setShowTradeForm(null); }}>Згорнути</Button>
                                  </div>

                                  {/* Trades for this pair */}
                                  {p.trades.length > 0 && (
                                    <div className="mt-3 border-t pt-3">
                                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Угоди ({p.trades.length})</p>
                                      <div className="space-y-2">
                                        {p.trades.slice(0, 10).map(t => (
                                          <div key={t.id} className="bg-secondary/50 rounded-lg p-2 text-[10px] space-y-1">
                                            <div className="flex justify-between items-center">
                                              <span className="font-bold" style={{ color: t.direction === "LONG" ? "#059669" : "#dc2626" }}>{t.direction === "LONG" ? "⬆ LONG" : "⬇ SHORT"}</span>
                                              <span className="font-bold px-1.5 py-0.5 rounded-full" style={{ background: t.result === "WIN" ? "#d1fae5" : t.result === "LOSS" ? "#fee2e2" : t.result === "BE" ? "#fef3c7" : "#dbeafe", color: t.result === "WIN" ? "#065f46" : t.result === "LOSS" ? "#991b1b" : t.result === "BE" ? "#92400e" : "#1e40af" }}>{t.result}</span>
                                            </div>
                                            <div className="flex gap-3 text-muted-foreground">
                                              <span>Вхід: <b className="font-mono">{t.entryPrice}</b></span>
                                              {t.exitPrice && <span>Вихід: <b className="font-mono">{t.exitPrice}</b></span>}
                                              <span>Лот: <b>{t.lots}</b></span>
                                            </div>
                                            {(t.sl || t.tp) && <div className="flex gap-3 text-muted-foreground">{t.sl && <span>SL: {t.sl}</span>}{t.tp && <span>TP: {t.tp}</span>}</div>}
                                            {t.pnl !== null && (
                                              <div className="font-bold" style={{ color: t.pnl >= 0 ? "#059669" : "#dc2626" }}>
                                                {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                                              </div>
                                            )}
                                            {t.setup && <div className="italic">{t.setup}</div>}
                                            {t.emotions && <div className="text-muted-foreground">🧠 {t.emotions}</div>}
                                            {t.result === "OPEN" && (
                                              <div className="flex gap-2 mt-1">
                                                {["WIN","LOSS","BE"].map(r => (
                                                  <button key={r} onClick={() => {
                                                    const ep = prompt("Ціна виходу:")
                                                    if (ep) closeTrade(t.id, r, ep)
                                                  }} className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-card hover:bg-muted transition-colors">{r}</button>
                                                ))}
                                              </div>
                                            )}
                                            <button onClick={() => deleteTrade(t.id)} className="text-[8px] text-red-400 hover:text-red-600 mt-1">видалити</button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Add trade */}
                                  {!showTradeForm || showTradeForm !== p.id ? (
                                    <Button size="sm" variant="outline" onClick={() => { setShowTradeForm(p.id); setTradeForm({ direction: "LONG", entryPrice: "", sl: "", tp: "", lots: "1", setup: "", emotions: "", notes: "" }); }}><Plus size={12} className="mr-1" /> Додати угоду</Button>
                                  ) : (
                                    <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
                                      <div className="flex gap-2">
                                        <button onClick={() => setTradeForm({ ...tradeForm, direction: "LONG" })} className={`px-3 py-1 rounded-full text-[10px] font-bold ${tradeForm.direction === "LONG" ? "bg-emerald-500 text-white" : "bg-card"}`}>LONG</button>
                                        <button onClick={() => setTradeForm({ ...tradeForm, direction: "SHORT" })} className={`px-3 py-1 rounded-full text-[10px] font-bold ${tradeForm.direction === "SHORT" ? "bg-red-500 text-white" : "bg-card"}`}>SHORT</button>
                                      </div>
                                      <div className="flex gap-2 flex-wrap">
                                        <Input placeholder="Вхід" value={tradeForm.entryPrice} onChange={e => setTradeForm({ ...tradeForm, entryPrice: e.target.value })} className="text-xs h-8 w-20" />
                                        <Input placeholder="SL" value={tradeForm.sl} onChange={e => setTradeForm({ ...tradeForm, sl: e.target.value })} className="text-xs h-8 w-20" />
                                        <Input placeholder="TP" value={tradeForm.tp} onChange={e => setTradeForm({ ...tradeForm, tp: e.target.value })} className="text-xs h-8 w-20" />
                                        <Input placeholder="Лоти" value={tradeForm.lots} onChange={e => setTradeForm({ ...tradeForm, lots: e.target.value })} className="text-xs h-8 w-16" />
                                      </div>
                                      <Input placeholder="Сетап (що побачив)" value={tradeForm.setup} onChange={e => setTradeForm({ ...tradeForm, setup: e.target.value })} className="text-xs h-8" />
                                      <Input placeholder="Емоції" value={tradeForm.emotions} onChange={e => setTradeForm({ ...tradeForm, emotions: e.target.value })} className="text-xs h-8" />
                                      <div className="flex gap-1">
                                        <Button size="sm" onClick={() => addTrade(p.id)}><Plus size={12} className="mr-1" /> Відкрити</Button>
                                        <Button size="sm" variant="outline" onClick={() => setShowTradeForm(null)}>Відміна</Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button className="text-left w-full" onClick={() => {
                                  setExpandedPair(p.id)
                                  setEditBias(p.bias || "NEUTRAL")
                                  setEditSupport(p.support ? String(p.support) : "")
                                  setEditResistance(p.resistance ? String(p.resistance) : "")
                                  setEditTvLink(p.tvLink || "")
                                  setEditDailyNotes(p.dailyNotes || "")
                                  setShowTradeForm(null)
                                }}>
                                  {p.dailyNotes ? (
                                    <div className="text-xs text-muted-foreground line-clamp-1">{p.dailyNotes}</div>
                                  ) : (
                                    <span className="text-[10px] italic opacity-30">Клікни для аналізу</span>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
