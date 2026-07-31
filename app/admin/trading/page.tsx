"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Star } from "lucide-react"
import { toast } from "sonner"

type Pair = {
  id: number; symbol: string; name: string | null; chartStatus: string
  priority: number; notes: string | null; tags: string[]
  updatedAt: string
}

const STATUS_OPTIONS = [
  { value: "UNCLEAR", label: "❓ Неясно", bg: "#fef3c7", fg: "#92400e" },
  { value: "WATCHING", label: "👀 Дивлюсь", bg: "#dbeafe", fg: "#1e40af" },
  { value: "CLEAR", label: "✅ Ясно", bg: "#d1fae5", fg: "#065f46" },
  { value: "TRADE", label: "🔥 В роботі", bg: "#fee2e2", fg: "#991b1b" },
]

const PRIORITY_COLORS = ["", "#ef4444", "#f97316", "#f59e0b", "#eab308", "#10b981"]

export default function TradingPage() {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/trading")
      const data = await res.json()
      const list = data.pairs ?? []
      // Auto-seed if empty
      if (list.length === 0) {
        await fetch("/api/admin/trading/seed", { method: "POST" })
        const res2 = await fetch("/api/admin/trading")
        const data2 = await res2.json()
        setPairs(data2.pairs ?? [])
        toast.success("167 пар завантажено")
      } else {
        setPairs(list)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: number, chartStatus: string) {
    await fetch("/api/admin/trading", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, chartStatus }),
    })
    load()
  }

  async function updatePriority(id: number, priority: number) {
    await fetch("/api/admin/trading", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, priority }),
    })
    load()
  }

  const filtered = pairs.filter(p => {
    if (filter !== "ALL" && p.chartStatus !== filter) return false
    if (search && !p.symbol.toLowerCase().includes(search.toLowerCase()) && !(p.name || "").toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts: Record<string, number> = { ALL: pairs.length }
  STATUS_OPTIONS.forEach(s => { counts[s.value] = pairs.filter(p => p.chartStatus === s.value).length })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Трейдинг</h2>
          <p className="text-sm text-muted-foreground mt-1">Щоденник графіків — 167 пар</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." className="max-w-[200px]" />
        {[{value:"ALL",label:"Всі"},{value:"UNCLEAR",label:"❓"},{value:"WATCHING",label:"👀"},{value:"CLEAR",label:"✅"},{value:"TRADE",label:"🔥"}].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f.value ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
            {f.label} {f.value === "ALL" ? `(${counts[f.value] || 0})` : `(${counts[f.value] || 0})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <div className="text-muted-foreground p-8 text-center">Завантаження...</div> : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-[#F9F9F7] text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-left">
                <th className="p-3">Пара</th>
                <th className="p-3 w-[120px]">Пріоритет</th>
                <th className="p-3 w-[140px]">Статус</th>
                <th className="p-3">Нотатки</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${p.chartStatus === "TRADE" ? "bg-red-50/30" : p.priority >= 4 ? "bg-yellow-50/20" : ""}`}>
                  <td className="p-3">
                    <div className="font-bold text-sm font-mono">{p.symbol}</div>
                    {p.name && <div className="text-xs text-muted-foreground">{p.name}</div>}
                    {p.notes && <div className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-1">{p.notes}</div>}
                    {p.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(p.tags as string[]).map((t, i) => (
                          <span key={i} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(st => (
                        <button key={st} onClick={() => updatePriority(p.id, p.priority === st ? 0 : st)}
                          className="transition-all"
                          style={{ color: st <= p.priority ? PRIORITY_COLORS[p.priority] || "#f59e0b" : "#d1d5db" }}>
                          <Star size={15} fill={st <= p.priority ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <select value={p.chartStatus} onChange={e => updateStatus(p.id, e.target.value)}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-full border-0 outline-none cursor-pointer"
                      style={{ background: STATUS_OPTIONS.find(s => s.value === p.chartStatus)?.bg, color: STATUS_OPTIONS.find(s => s.value === p.chartStatus)?.fg }}>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value} className="bg-white text-black">{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {p.notes ? (
                      <div className="whitespace-pre-wrap line-clamp-2">{p.notes}</div>
                    ) : (
                      <span className="italic opacity-30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
