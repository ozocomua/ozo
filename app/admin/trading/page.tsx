"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Eye, EyeOff, Star, Pencil, X, Save, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

type Pair = {
  id: number
  symbol: string
  name: string | null
  chartStatus: string
  priority: number
  notes: string | null
  tags: string[]
  updatedAt: string
}

const STATUS_OPTIONS = [
  { value: "UNCLEAR", label: "❓ Неясно", color: "bg-amber-100 text-amber-800" },
  { value: "WATCHING", label: "👀 Дивлюсь", color: "bg-blue-100 text-blue-800" },
  { value: "CLEAR", label: "✅ Ясно", color: "bg-emerald-100 text-emerald-800" },
  { value: "TRADE", label: "🔥 В роботі", color: "bg-red-100 text-red-800" },
]

const PRIORITY_COLORS = ["", "text-red-500 fill-red-500", "text-orange-500 fill-orange-500", "text-amber-500 fill-amber-500", "text-yellow-500 fill-yellow-500", "text-emerald-500 fill-emerald-500"]

export default function TradingPage() {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")

  // New pair form
  const [showNew, setShowNew] = useState(false)
  const [newSymbol, setNewSymbol] = useState("")
  const [newName, setNewName] = useState("")

  // Editing
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNotes, setEditNotes] = useState("")
  const [editTags, setEditTags] = useState("")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/trading")
      setPairs((await res.json()).pairs ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function addPair() {
    if (!newSymbol.trim()) return
    const res = await fetch("/api/admin/trading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: newSymbol.trim(), name: newName.trim() || null }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success("Пару додано")
      setNewSymbol(""); setNewName(""); setShowNew(false)
      load()
    } else toast.error(data.error || "Помилка")
  }

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

  async function saveNotes(id: number) {
    const tags = editTags.split(",").map(t => t.trim()).filter(Boolean)
    await fetch("/api/admin/trading", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes: editNotes, tags }),
    })
    setEditingId(null)
    load()
    toast.success("Збережено")
  }

  async function deletePair(id: number, symbol: string) {
    if (!confirm(`Видалити ${symbol}?`)) return
    await fetch("/api/admin/trading", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    load()
    toast.success("Видалено")
  }

  function startEdit(p: Pair) {
    setEditingId(p.id)
    setEditNotes(p.notes || "")
    setEditTags((p.tags || []).join(", "))
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
          <p className="text-sm text-muted-foreground mt-1">Щоденник графіків — розбирай монети щоб не плутатись</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus size={16} className="mr-1" /> Додати пару
        </Button>
      </div>

      {/* New pair */}
      {showNew && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Символ</label>
            <Input value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="BTCUSDT" className="w-36" onKeyDown={e => e.key === "Enter" && addPair()} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Назва</label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Bitcoin" className="w-48" onKeyDown={e => e.key === "Enter" && addPair()} />
          </div>
          <Button onClick={addPair}>Додати</Button>
          <Button variant="outline" onClick={() => setShowNew(false)}>Відміна</Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." className="max-w-[200px]" />
        {[{value:"ALL",label:"Всі"},{value:"UNCLEAR",label:"❓"},{value:"WATCHING",label:"👀"},{value:"CLEAR",label:"✅"},{value:"TRADE",label:"🔥"}].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f.value ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>
            {f.label} {f.value !== "ALL" ? "" : `(${counts[f.value] || 0})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <div className="text-muted-foreground p-8 text-center">Завантаження...</div> : filtered.length === 0 ? (
        <div className="text-muted-foreground p-12 text-center bg-white rounded-2xl border">Немає пар. Додайте першу.</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-[#F9F9F7] text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-left">
                <th className="p-3">Пара</th>
                <th className="p-3">Пріоритет</th>
                <th className="p-3">Статус</th>
                <th className="p-3">Нотатки</th>
                <th className="p-3 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${p.chartStatus === "TRADE" ? "bg-red-50/30" : p.priority >= 4 ? "bg-yellow-50/20" : ""}`}>
                  <td className="p-3">
                    <div className="font-bold text-sm font-mono">{p.symbol}</div>
                    {p.name && <div className="text-xs text-muted-foreground">{p.name}</div>}
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
                          className={`transition-all ${st <= p.priority ? PRIORITY_COLORS[p.priority] || "text-amber-500" : "text-gray-300 hover:text-gray-400"}`}>
                          <Star size={15} fill={st <= p.priority ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <select value={p.chartStatus} onChange={e => updateStatus(p.id, e.target.value)}
                      className="text-xs font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer"
                      style={{ background: STATUS_OPTIONS.find(s => s.value === p.chartStatus)?.color.split(" ")[0]?.replace("bg-", "") || "#f3f4f6" }}>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value} className="bg-white text-black">{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 max-w-[300px]">
                    {editingId === p.id ? (
                      <div className="space-y-2">
                        <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Нотатки по графіку..." className="w-full h-20 rounded-md border px-3 py-2 text-xs resize-y" autoFocus />
                        <Input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="Теги через кому: scalp, swing" className="text-xs" />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => saveNotes(p.id)}><Save size={12} className="mr-1" /> Зберегти</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Відміна</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors min-h-[24px]" onClick={() => startEdit(p)}>
                        {p.notes ? (
                          <div className="whitespace-pre-wrap line-clamp-3">{p.notes}</div>
                        ) : (
                          <span className="italic opacity-40">Клікни щоб додати нотатки...</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {editingId !== p.id && (
                        <button onClick={() => startEdit(p)} className="p-1.5 hover:bg-muted rounded transition-colors"><Pencil size={13} /></button>
                      )}
                      <button onClick={() => deletePair(p.id, p.symbol)} className="p-1.5 hover:bg-red-50 rounded transition-colors"><Trash2 size={13} className="text-red-400" /></button>
                    </div>
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
