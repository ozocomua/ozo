"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { slugify } from "@/lib/slug"

type BrandRow = {
  id: number
  name: string
  slug: string
}

export function BrandForm({ mode, brandId }: { mode: "create" | "edit"; brandId?: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  useEffect(() => {
    async function run() {
      setLoading(true)
      setError(null)
      try {
        if (mode === "edit" && brandId) {
          const res = await fetch("/api/admin/catalog/brands", { cache: "no-store" })
          const data = (await res.json().catch(() => ({}))) as { brands?: BrandRow[]; error?: string }
          if (!res.ok) {
            setError(data.error ?? "Не вдалося завантажити бренд.")
            return
          }
          const list = Array.isArray(data.brands) ? data.brands : []
          const found = list.find((b) => b.id === brandId)
          if (!found) {
            setError("Бренд не знайдено.")
            return
          }
          setName(found.name ?? "")
          setSlug(found.slug ?? "")
          setSlugTouched(true)
        }
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [mode, brandId])

  async function onSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = { name, slug }
      const res =
        mode === "create"
          ? await fetch("/api/admin/catalog/brands", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/admin/catalog/brands/${brandId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })

      const data = (await res.json().catch(() => ({}))) as { id?: number; error?: string }
      if (!res.ok) {
        setError(data.error ?? "Не вдалося зберегти.")
        return
      }
      if (mode === "create" && data.id) {
        window.location.href = ".."
      } else {
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight">
            {mode === "create" ? "Новий бренд" : "Редагування бренду"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Назва та SEO URL.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { window.location.href = ".." }}>
            Назад
          </Button>
          <Button onClick={() => void onSave()} disabled={saving || loading || !name.trim() || !slug.trim()}>
            {saving ? "Збереження…" : "Зберегти"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Назва
          </div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Наприклад: Koch Chemie" />
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            SEO URL
          </div>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            placeholder="koch-chemie"
          />
        </div>
      </div>
    </div>
  )
}

