"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { slugify } from "@/lib/slug"

type CategoryRow = {
  id: number
  name: string
  parentId: number | null
}

type BrandRow = {
  id: number
  name: string
}

type VariantDraft = {
  id?: number
  sku: string
  volume: string
  packageType: string
  priceRetail: string
  priceWholesale: string
  stock: string
}

type ImageDraft = {
  id?: number
  url: string
  alt: string
  sort: number
}

type ProductDto = {
  id: number
  name: string
  slug: string
  description: string
  fullDescription: string
  badge: string | null
  isPublished: boolean
  isPopular: boolean
  relatedIds: number[]
  brandId: number | null
  categoryIds: number[]
  variants: Array<{
    id: number
    sku: string
    volume: string
    packageType: string
    priceRetail: number
    priceWholesale: number | null
    stock: number
  }>
  images: Array<{ id: number; url: string; alt: string; sort: number }>
}

function toVariantDraft(v: ProductDto["variants"][number]): VariantDraft {
  return {
    id: v.id,
    sku: v.sku,
    volume: v.volume,
    packageType: v.packageType,
    priceRetail: String(v.priceRetail ?? ""),
    priceWholesale: v.priceWholesale === null ? "" : String(v.priceWholesale),
    stock: String(v.stock ?? 0),
  }
}

function toImageDraft(v: ProductDto["images"][number]): ImageDraft {
  return { id: v.id, url: v.url, alt: v.alt ?? "", sort: v.sort ?? 0 }
}

function normalizeNumberInput(v: string): string {
  return v.replace(",", ".").replace(/[^\d.]/g, "")
}

function categoryPath(categories: CategoryRow[], id: number): string {
  const byId = new Map<number, CategoryRow>()
  for (const c of categories) byId.set(c.id, c)
  const parts: string[] = []
  let cur = byId.get(id)
  let guard = 0
  while (cur && guard < 6) {
    parts.unshift(cur.name)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
    guard += 1
  }
  return parts.join(" → ")
}

export function ProductForm({ mode, productId }: { mode: "create" | "edit"; productId?: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)

  const [brands, setBrands] = useState<BrandRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [allProducts, setAllProducts] = useState<Array<{ id: number; name: string }>>([])

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [fullDescription, setFullDescription] = useState("")
  const [badge, setBadge] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [isPopular, setIsPopular] = useState(false)
  const [relatedIds, setRelatedIds] = useState<number[]>([])
  const [relatedQ, setRelatedQ] = useState("")
  const [brandId, setBrandId] = useState<string>("")

  const [categoryQ, setCategoryQ] = useState("")
  const [categoryIds, setCategoryIds] = useState<number[]>([])

  const [variants, setVariants] = useState<VariantDraft[]>([
    { sku: "", volume: "1 л", packageType: "флакон", priceRetail: "", priceWholesale: "", stock: "0" },
  ])
  const [images, setImages] = useState<ImageDraft[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  const filteredCategories = useMemo(() => {
    const query = categoryQ.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((c) => categoryPath(categories, c.id).toLowerCase().includes(query))
  }, [categories, categoryQ])

  async function upload(file: File) {
    const fd = new FormData()
    fd.set("file", file)
    const res = await fetch("/api/admin/uploads", { method: "POST", body: fd })
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      throw new Error(data.error ?? "Не вдалося завантажити файл.")
    }
    return data.url
  }

  useEffect(() => {
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const [bRes, cRes, aRes, pRes] = await Promise.all([
          fetch("/api/admin/catalog/brands", { cache: "no-store" }),
          fetch("/api/admin/catalog/categories", { cache: "no-store" }),
          fetch("/api/admin/catalog/products?published=true", { cache: "no-store" }),
          mode === "edit" && productId
            ? fetch(`/api/admin/catalog/products/${productId}`, { cache: "no-store" })
            : Promise.resolve(null),
        ])

        const bData = (await bRes.json().catch(() => ({}))) as { brands?: BrandRow[] }
        const cData = (await cRes.json().catch(() => ({}))) as { categories?: CategoryRow[] }
        const aData = (await aRes.json().catch(() => ({}))) as { products?: Array<{ id: number; name: string }> }

        setBrands(Array.isArray(bData.brands) ? bData.brands : [])
        setCategories(Array.isArray(cData.categories) ? cData.categories : [])
        setAllProducts(Array.isArray(aData.products) ? aData.products : [])

        if (pRes) {
          const pData = (await pRes.json().catch(() => ({}))) as { product?: ProductDto; error?: string }
          if (!pRes.ok || !pData.product) {
            setError(pData.error ?? "Не вдалося завантажити товар.")
            return
          }
          const p = pData.product
          setName(p.name ?? "")
          setSlug(p.slug ?? "")
          setDescription(p.description ?? "")
          setFullDescription(p.fullDescription ?? "")
          setBadge(p.badge ?? "")
          setIsPublished(Boolean(p.isPublished))
          setIsPopular(Boolean(p.isPopular))
          setRelatedIds(Array.isArray(p.relatedIds) ? p.relatedIds : [])
          setBrandId(p.brandId ? String(p.brandId) : "")
          setCategoryIds(Array.isArray(p.categoryIds) ? p.categoryIds : [])
          setVariants(p.variants.length ? p.variants.map(toVariantDraft) : variants)
          setImages(p.images.map(toImageDraft))
          setSlugTouched(true)
        }
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [mode, productId])

  function toggleCategory(id: number) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { sku: "", volume: "1 л", packageType: "флакон", priceRetail: "", priceWholesale: "", stock: "0" },
    ])
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  async function onFiles(files: FileList | File[]) {
    const arr = Array.from(files).slice(0, 20)
    if (!arr.length) return
    setSaving(true)
    setError(null)
    try {
      const uploaded: ImageDraft[] = []
      for (const file of arr) {
        const url = await upload(file)
        uploaded.push({ url, alt: "", sort: images.length + uploaded.length })
      }
      setImages((prev) => [...prev, ...uploaded].map((img, idx) => ({ ...img, sort: idx })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити файл.")
    } finally {
      setSaving(false)
    }
  }

  function moveImage(from: number, to: number) {
    setImages((prev) => {
      const next = [...prev]
      const [it] = next.splice(from, 1)
      next.splice(to, 0, it)
      return next.map((img, idx) => ({ ...img, sort: idx }))
    })
  }

  async function onSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        product: {
          name,
          slug,
          description,
          fullDescription,
          badge,
          isPublished,
          isPopular,
          relatedIds,
          brandId: brandId ? Number(brandId) : null,
        },
        categoryIds,
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          volume: v.volume,
          packageType: v.packageType,
          priceRetail: Number(normalizeNumberInput(v.priceRetail)),
          priceWholesale: v.priceWholesale.trim() ? Number(normalizeNumberInput(v.priceWholesale)) : null,
          stock: Number(v.stock),
        })),
        images: images.map((img) => ({ id: img.id, url: img.url, alt: img.alt, sort: img.sort })),
      }

      const res =
        mode === "create"
          ? await fetch("/api/admin/catalog/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/admin/catalog/products/${productId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })

      const data = (await res.json().catch(() => ({}))) as { id?: number; error?: string }
      if (!res.ok) {
        setError(data.error ?? "Не вдалося зберегти товар.")
        return
      }

      if (mode === "create" && data.id) {
        router.replace(`../${data.id}`)
      } else {
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function duplicate() {
    if (!productId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/duplicate`, { method: "POST" })
      const data = (await res.json().catch(() => ({}))) as { id?: number; error?: string }
      if (!res.ok || !data.id) {
        setError(data.error ?? "Не вдалося дублювати.")
        return
      }
      router.replace(`../${data.id}`)
    } finally {
      setSaving(false)
    }
  }

  async function del() {
    if (!productId) return
    const answer = window.prompt(`Удалить товар "${name}"? Введите DELETE для подтверждения.`)
    if (answer !== "DELETE") return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}`, { method: "DELETE" })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Не вдалося видалити товар.")
        return
      }
      router.replace("../..")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight">
            {mode === "create" ? "Новий товар" : "Редагування товару"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Заповни основне, категорії, варіанти та фото.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="../..">Назад</Link>
          </Button>
          {mode === "edit" ? (
            <>
              <Button variant="outline" onClick={() => void duplicate()} disabled={saving || loading}>
                Дублювати
              </Button>
              <Button variant="destructive" onClick={() => void del()} disabled={saving || loading}>
                Удалить
              </Button>
            </>
          ) : null}
          <Button onClick={() => void onSave()} disabled={saving || loading || !name.trim() || !slug.trim()}>
            {saving ? "Збереження…" : "Зберегти"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="rounded-2xl border bg-white p-5 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Назва</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Наприклад: Shampoo Star" />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Кастомный URL (Slug)</div>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="наприклад: napuvalka-nipelna (якщо залишити порожнім, спрацює автогенерація)"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Бренд</div>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">—</option>
              {brands.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Статус</div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={() => setIsPublished((v) => !v)}
                className="h-4 w-4"
              />
              <span className="text-sm">{isPublished ? "Опубліковано" : "Чернетка"}</span>
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Популярність</div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={() => setIsPopular((v) => !v)}
                className="h-4 w-4"
              />
              <span className="text-sm">Популярний товар (виводити першим на головній)</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Рекомендовані товари (Беруть разом)
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Обери товари, які будуть показані на картці як супутні.
              </div>
            </div>
            <Badge variant="outline">{relatedIds.length}</Badge>
          </div>
          <Input
            value={relatedQ}
            onChange={(e) => setRelatedQ(e.target.value)}
            placeholder="Пошук за назвою товару"
          />
          <div className="max-h-[200px] overflow-auto rounded-xl border bg-[#F9F9F7] p-3 space-y-2">
            {allProducts
              .filter((p) => {
                if (productId && p.id === productId) return false
                if (relatedQ.trim()) {
                  return p.name.toLowerCase().includes(relatedQ.trim().toLowerCase())
                }
                return true
              })
              .slice(0, 50)
              .map((p) => (
                <label key={p.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={relatedIds.includes(p.id)}
                    onChange={() =>
                      setRelatedIds((prev) =>
                        prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                      )
                    }
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            {!allProducts.filter((p) => !productId || p.id !== productId).length ? (
              <div className="text-sm text-muted-foreground">Немає товарів.</div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Короткий опис</div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Бейдж (опціонально)</div>
            <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Хіт продажів" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Повний опис</div>
          <Textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} rows={8} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Категорії</div>
            <div className="text-sm text-muted-foreground mt-1">
              Обери одну або кілька категорій.
            </div>
          </div>
          <Badge variant="outline">{categoryIds.length}</Badge>
        </div>
        <Input value={categoryQ} onChange={(e) => setCategoryQ(e.target.value)} placeholder="Пошук за категоріями" />
        <div className="max-h-[260px] overflow-auto rounded-xl border bg-[#F9F9F7] p-3 space-y-2">
          {filteredCategories.map((c) => (
            <label key={c.id} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={categoryIds.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
              />
              <span>{categoryPath(categories, c.id) || c.name}</span>
            </label>
          ))}
          {!filteredCategories.length ? (
            <div className="text-sm text-muted-foreground">Немає категорій.</div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Варіанти</div>
            <div className="text-sm text-muted-foreground mt-1">
              Об'єм/тара/ціна/склад. SKU має бути унікальним.
            </div>
          </div>
          <Button variant="outline" onClick={addVariant}>
            + Варіант
          </Button>
        </div>

        <div className="space-y-3">
          {variants.map((v, idx) => (
            <div key={idx} className="rounded-xl border bg-[#F9F9F7] p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Варіант {idx + 1}</div>
                {variants.length > 1 ? (
                  <Button variant="destructive" size="sm" onClick={() => removeVariant(idx)}>
                    Удалить
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SKU</div>
                  <Input
                    value={v.sku}
                    onChange={(e) =>
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, sku: e.target.value } : x)))
                    }
                    placeholder="OZO-SKU-001"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Об'єм/вага</div>
                  <Input
                    value={v.volume}
                    onChange={(e) =>
                      setVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, volume: e.target.value } : x)))
                    }
                    placeholder="1 л"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Тара</div>
                  <Input
                    value={v.packageType}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, packageType: e.target.value } : x))
                      )
                    }
                    placeholder="флакон"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ціна (роздріб)</div>
                  <Input
                    value={v.priceRetail}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, priceRetail: normalizeNumberInput(e.target.value) } : x
                        )
                      )
                    }
                    placeholder="320"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ціна (опт)</div>
                  <Input
                    value={v.priceWholesale}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, priceWholesale: normalizeNumberInput(e.target.value) } : x
                        )
                      )
                    }
                    placeholder="300"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Склад (шт)</div>
                  <Input
                    value={v.stock}
                    onChange={(e) =>
                      setVariants((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, stock: e.target.value.replace(/[^\d]/g, "") } : x
                        )
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Фото</div>
            <div className="text-sm text-muted-foreground mt-1">
              Перетягни для зміни порядку. Перше фото — головне.
            </div>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files) void onFiles(files)
                e.target.value = ""
              }}
            />
            <span className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium">
              Завантажити
            </span>
          </label>
        </div>

        <div
          className="rounded-xl border border-dashed bg-[#F9F9F7] p-6 text-center text-sm text-muted-foreground"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const files = e.dataTransfer.files
            if (files && files.length) void onFiles(files)
          }}
        >
          Перетягни файли сюди
        </div>

        {images.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div
                key={`${img.url}-${idx}`}
                className="rounded-xl border bg-white overflow-hidden"
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === idx) return
                  moveImage(dragIndex, idx)
                  setDragIndex(null)
                }}
              >
                <div className="relative">
                  <img src={img.url} alt="" className="w-full h-28 object-cover" />
                  {idx === 0 ? (
                    <div className="absolute top-2 left-2">
                      <Badge>Головне</Badge>
                    </div>
                  ) : null}
                </div>
                <div className="p-2 space-y-2">
                  <Input
                    value={img.alt}
                    onChange={(e) =>
                      setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, alt: e.target.value } : x)))
                    }
                    placeholder="Alt (опц.)"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, Math.max(0, idx - 1))}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={idx === images.length - 1}
                      onClick={() => moveImage(idx, Math.min(images.length - 1, idx + 1))}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx).map((x, i) => ({ ...x, sort: i })))}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Немає фото.</div>
        )}
      </div>
    </div>
  )
}
