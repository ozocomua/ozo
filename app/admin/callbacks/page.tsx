"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

type CallbackItem = {
  id: number
  name: string
  phone: string
  comment: string | null
  status: string
  createdAt: string
}

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "PENDING", label: "🟡 Очікує" },
  { value: "PROCESSED", label: "🟢 Оброблено" },
]

export default function CallbacksPage() {
  const [callbacks, setCallbacks] = useState<CallbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyIds, setBusyIds] = useState<Record<number, boolean>>({})

  const fetchCallbacks = async () => {
    try {
      const res = await fetch("/api/admin/callbacks")
      const data = await res.json()
      setCallbacks(data.callbacks ?? [])
    } catch {
      toast.error("Не вдалося завантажити заявки")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCallbacks()
  }, [])

  const updateStatus = async (id: number, nextStatus: string) => {
    setBusyIds((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/callbacks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Не вдалося оновити статус")
        return
      }
      setCallbacks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
      )
    } catch {
      toast.error("Помилка мережі")
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const deleteCallback = async (id: number) => {
    if (!confirm("Видалити заявку?")) return
    setBusyIds((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/callbacks/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Не вдалося видалити")
        return
      }
      setCallbacks((prev) => prev.filter((c) => c.id !== id))
    } catch {
      toast.error("Помилка мережі")
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-muted-foreground text-xs uppercase tracking-widest">
        Завантаження...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-serif italic">Заявки на дзвінок</h1>
        <span className="text-xs text-muted-foreground">
          {callbacks.length} заявок
        </span>
      </div>

      {callbacks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-xs uppercase tracking-widest">
          Заявок поки що немає
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-[#F9F9F7] text-left">
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Дата
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Ім&apos;я
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Телефон
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Коментар
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Статус
                </th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody>
              {callbacks.map((cb) => (
                <tr
                  key={cb.id}
                  className="border-b border-black/5 last:border-0 hover:bg-[#F9F9F7] transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(cb.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium">{cb.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`tel:${cb.phone}`}
                      className="text-primary font-mono text-xs hover:underline"
                    >
                      {cb.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                    {cb.comment || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={cb.status}
                      onChange={(e) => updateStatus(cb.id, e.target.value)}
                      disabled={busyIds[cb.id]}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteCallback(cb.id)}
                      disabled={busyIds[cb.id]}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-20"
                      title="Видалити"
                    >
                      <Trash2 size={14} />
                    </button>
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
