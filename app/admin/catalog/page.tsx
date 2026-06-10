"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type BrandRow = { id: number; name: string }
type CategoryRow = { id: number; name: string; parentId: number | null }

type ProductRow = {
  id: number
  name: string
  slug: string
  description: string
  badge: string | null
  isPublished: boolean
  brand: { id: number; name: string } | null
  categories: Array<{ category: CategoryRow }>
  variants: Array<{ id: number; sku: string; volume: string; packageType: string; priceRetail: number; stock: number }>
  images: Array<{ id: number; url: string; sort: number }>
}

function money(v: number): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return `${n.toFixed(0)} ₴`
}

function sumStock(variants: ProductRow["variants"]): number {
  return variants.reduce((s, v) => s + (Number.isFinite(v.stock) ? v.stock : 0), 0)
}

function priceRange(variants: ProductRow["variants"]): string {
  const prices = variants.map((v) => Number(v.priceRetail)).filter((n) => Number.isFinite(n))
  if (!prices.length) return "—"
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? money(min) : `${money(min)}–${money(max)}`
}

export default function AdminCatalogProductsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyById, setBusyById] = useState<Record<number, boolean>>({})
  const [products, setProducts] = useState<ProductRow[]>([])
  const [brands, setBrands] = useState<BrandRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])

  const [q, setQ] = useState("")
  const [brandId, setBrandId] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [published, setPublished] = useState<string>("")

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (brandId) params.set("brandId", brandId)
    if (categoryId) params.set("categoryId", categoryId)
    if (published) params.set("published", published)
    return params.toString()
  }, [q, brandId, categoryId, published])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [pRes, bRes, cRes] = await Promise.all([
        fetch(`/api/admin/catalog/products?${query}`, { cache: "no-store" }),
        fetch("/api/admin/catalog/brands", { cache: "no-store" }),
        fetch("/api/admin/catalog/categories", { cache: "no-store" }),
      ])

      const pData = (await pRes.json().catch(() => ({}))) as { products?: ProductRow[]; error?: string }
      const bData = (await bRes.json().catch(() => ({}))) as { brands?: BrandRow[] }
      const cData = (await cRes.json().catch(() => ({}))) as { categories?: CategoryRow[] }

      if (!pRes.ok) {
        setProducts([])
        setError(pData.error ?? "Не вдалося завантажити товари.")
      } else {
        setProducts(Array.isArray(pData.products) ? pData.products : [])
      }
      setBrands(Array.isArray(bData.brands) ? bData.brands : [])
      setCategories(Array.isArray(cData.categories) ? cData.categories : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [query])

  async function duplicateProduct(id: number) {
    setBusyById((s) => ({ ...s, [id]: true }))
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/products/${id}/duplicate`, { method: "POST" })
      const data = (await res.json().catch(() => ({}))) as { id?: number; error?: string }
      if (!res.ok || !data.id) {
        setError(data.error ?? "Не вдалося дублювати.")
        return
      }
      window.location.href = `./products/${data.id}`
    } finally {
      setBusyById((s) => ({ ...s, [id]: false }))
    }
  }

  async function deleteProduct(id: number, name: string) {
    const answer = window.prompt(`Видалити товар "${name}"? Введіть DELETE для підтвердження.`)
    if (answer !== "DELETE") return
    setBusyById((s) => ({ ...s, [id]: true }))
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/products/${id}`, { method: "DELETE" })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Не вдалося видалити товар.")
        return
      }
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setBusyById((s) => ({ ...s, [id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight">Товари</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Пошук за назвою, URL або SKU. Дублювання зручно для варіантів.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={() => { window.location.href = window.location.pathname + '/products/new' }}>
            + Товар
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="grid gap-2 md:grid-cols-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: назва / URL / SKU" />
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Бренд: всі</option>
            {brands.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Категорія: всі</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={published}
            onChange={(e) => setPublished(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Публікація: всі</option>
            <option value="true">Опубліковано</option>
            <option value="false">Чернетка</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Оновити
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setQ("")
              setBrandId("")
              setCategoryId("")
              setPublished("")
            }}
          >
            Скинути
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border bg-white p-6 text-center text-muted-foreground">
            Завантаження…
          </div>
        ) : products.length ? (
          products.map((p) => {
            const stock = sumStock(p.variants)
            const range = priceRange(p.variants)
            const cover = p.images?.[0]?.url ?? ""
            return (
              <div key={p.id} className="rounded-2xl border bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">/{p.slug}</div>
                  </div>
                  <Badge variant={p.isPublished ? "default" : "outline"}>
                    {p.isPublished ? "Опубліковано" : "Чернетка"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{range}</Badge>
                  <Badge variant={stock > 0 ? "secondary" : "outline"}>
                    Склад: {stock}
                  </Badge>
                  {p.brand?.name ? <Badge variant="outline">{p.brand.name}</Badge> : null}
                </div>
                {cover ? (
                  <div className="rounded-xl border bg-[#F9F9F7] overflow-hidden">
                    <img src={cover} alt="" className="w-full h-40 object-cover" />
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => { window.location.href = window.location.pathname + `/products/${p.id}` }}>
                    Редагувати
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void duplicateProduct(p.id)}
                    disabled={Boolean(busyById[p.id])}
                  >
                    Дубль
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void deleteProduct(p.id, p.name)}
                    disabled={Boolean(busyById[p.id])}
                  >
                    Видалити
                  </Button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-2xl border bg-white p-6 text-center text-muted-foreground">
            Немає товарів.
          </div>
        )}
      </div>

      <div className="hidden md:block rounded-xl border bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_220px_140px_160px_260px] gap-0 border-b bg-[#F9F9F7] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <div>Товар</div>
          <div>Категорії</div>
          <div>Ціна</div>
          <div>Склад</div>
          <div></div>
        </div>
        {loading ? (
          <div className="px-4 py-10 text-center text-muted-foreground">Завантаження…</div>
        ) : products.length ? (
          <div className="divide-y">
            {products.map((p) => {
              const stock = sumStock(p.variants)
              const range = priceRange(p.variants)
              const cats = (p.categories ?? []).map((c: { category: { name: string } }) => c.category.name).slice(0, 2)
              return (
                <div key={p.id} className="grid grid-cols-[1fr_220px_140px_160px_260px] items-center gap-0 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{p.name}</div>
                      <Badge variant={p.isPublished ? "default" : "outline"}>
                        {p.isPublished ? "Опубліковано" : "Чернетка"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">/{p.slug}</div>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {cats.length ? cats.join(", ") : "—"}
                    {cats.length > 2 ? ` +${cats.length - 2}` : ""}
                  </div>
                  <div className="text-sm font-medium">{range}</div>
                  <div className="text-sm text-muted-foreground">{stock}</div>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { window.location.href = window.location.pathname + `/products/${p.id}` }}>
                      Редагувати
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void duplicateProduct(p.id)}
                      disabled={Boolean(busyById[p.id])}
                    >
                      Дубль
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void deleteProduct(p.id, p.name)}
                      disabled={Boolean(busyById[p.id])}
                    >
                      Видалити
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-muted-foreground">Немає товарів.</div>
        )}
      </div>
    </div>
  )
}
