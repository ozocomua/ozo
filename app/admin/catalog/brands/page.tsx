"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type BrandRow = {
  id: number
  name: string
  slug: string
}

export default function AdminBrandsPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<BrandRow[]>([])
  const [q, setQ] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busyById, setBusyById] = useState<Record<number, boolean>>({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/catalog/brands", { cache: "no-store" })
      const data = (await res.json().catch(() => ({}))) as { brands?: BrandRow[]; error?: string }
      if (!res.ok) {
        setRows([])
        setError(data.error ?? "Не вдалося завантажити бренди.")
        return
      }
      setRows(Array.isArray(data.brands) ? data.brands : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return query ? rows.filter((r) => `${r.name} ${r.slug}`.toLowerCase().includes(query)) : rows
  }, [rows, q])

  async function deleteBrand(id: number, name: string) {
    const answer = window.prompt(`Удалить бренд "${name}"? Введите DELETE для подтверждения.`)
    if (answer !== "DELETE") return
    setBusyById((s) => ({ ...s, [id]: true }))
    try {
      const res = await fetch(`/api/admin/catalog/brands/${id}`, { method: "DELETE" })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Не вдалося видалити бренд.")
        return
      }
      setRows((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setBusyById((s) => ({ ...s, [id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight">Бренды</h1>
          <p className="text-muted-foreground mt-1 text-sm">Список брендов для карточки товара.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: название или URL"
            className="sm:w-[260px]"
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Оновити
          </Button>
          <Button onClick={() => { window.location.href = window.location.pathname + '/new' }}>
            + Бренд
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border bg-white p-6 text-center text-muted-foreground">
            Завантаження…
          </div>
        ) : filtered.length ? (
          filtered.map((row) => (
            <div key={row.id} className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{row.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">/{row.slug}</div>
                </div>
                <Badge variant="outline">#{row.id}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { window.location.href = window.location.pathname + `/${row.id}` }}>
                  Редактировать
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void deleteBrand(row.id, row.name)}
                  disabled={Boolean(busyById[row.id])}
                >
                  Удалить
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border bg-white p-6 text-center text-muted-foreground">
            Немає брендів.
          </div>
        )}
      </div>

      <div className="hidden md:block rounded-xl border bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_240px_220px] gap-0 border-b bg-[#F9F9F7] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <div>Бренд</div>
          <div>URL</div>
          <div></div>
        </div>
        {loading ? (
          <div className="px-4 py-10 text-center text-muted-foreground">Завантаження…</div>
        ) : filtered.length ? (
          <div className="divide-y">
            {filtered.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_240px_220px] items-center gap-0 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{row.name}</div>
                  <div className="text-xs text-muted-foreground">#{row.id}</div>
                </div>
                <div className="text-sm text-muted-foreground truncate">/{row.slug}</div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { window.location.href = window.location.pathname + `/${row.id}` }}>
                    Редактировать
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void deleteBrand(row.id, row.name)}
                    disabled={Boolean(busyById[row.id])}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-muted-foreground">Немає брендів.</div>
        )}
      </div>
    </div>
  )
}
