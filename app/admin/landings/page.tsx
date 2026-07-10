"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, X } from "lucide-react"
import { toast } from "sonner"

type Landing = {
  id: number
  slug: string
  title: string
  subtitle: string | null
  productName: string
  productDesc: string | null
  productPrice: number
  productOldPrice: number | null
  productImage: string | null
  productImages: string[]
  ctaText: string
  bgColor: string
  btnColor: string
  textColor: string
  metaTitle: string | null
  metaDescription: string | null
  isPublished: boolean
}

const emptyForm = {
  slug: "",
  title: "",
  subtitle: "",
  productName: "",
  productDesc: "",
  productPrice: "0",
  productOldPrice: "",
  productImage: "",
  productImages: [] as string[],
  ctaText: "Купити",
  bgColor: "#F9F9F7",
  btnColor: "#0B53A4",
  textColor: "#111111",
  metaTitle: "",
  metaDescription: "",
}

export default function LandingsPage() {
  const [landings, setLandings] = useState<Landing[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [newImgUrl, setNewImgUrl] = useState("")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/landings")
      setLandings((await res.json()).landings ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function startEdit(l: Landing) {
    setEditingId(l.id)
    setCreating(false)
    setForm({
      slug: l.slug,
      title: l.title,
      subtitle: l.subtitle || "",
      productName: l.productName || "",
      productDesc: l.productDesc || "",
      productPrice: String(l.productPrice || 0),
      productOldPrice: l.productOldPrice ? String(l.productOldPrice) : "",
      productImage: l.productImage || "",
      productImages: Array.isArray(l.productImages) ? l.productImages : [],
      ctaText: l.ctaText,
      bgColor: l.bgColor,
      btnColor: l.btnColor,
      textColor: l.textColor,
      metaTitle: l.metaTitle || "",
      metaDescription: l.metaDescription || "",
    })
  }

  function startCreate() {
    setCreating(true)
    setEditingId(null)
    setForm(emptyForm)
  }

  function addImage() {
    const url = newImgUrl.trim()
    if (!url) return
    setForm({ ...form, productImages: [...form.productImages, url] })
    setNewImgUrl("")
    if (!form.productImage) setForm(f => ({ ...f, productImage: url }))
  }

  function removeImage(idx: number) {
    const arr = form.productImages.filter((_, i) => i !== idx)
    setForm({ ...form, productImages: arr, productImage: arr[0] || "" })
  }

  async function save() {
    if (!form.slug.trim() || !form.title.trim()) {
      toast.error("Slug і заголовок обов'язкові")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/landings", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingId ? "Лендінг оновлено" : "Лендінг створено")
        setCreating(false)
        setEditingId(null)
        setForm(emptyForm)
        load()
      } else {
        toast.error(data.error || "Помилка")
      }
    } catch { toast.error("Мережева помилка") }
    finally { setSaving(false) }
  }

  function cancel() {
    setCreating(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function togglePublish(id: number) {
    await fetch(`/api/admin/landings/${id}/toggle`, { method: "POST" })
    load()
  }

  async function deleteLanding(id: number, title: string) {
    if (!confirm(`Видалити лендінг «${title}»?`)) return
    await fetch(`/api/admin/landings/${id}`, { method: "DELETE" })
    load()
    toast.success("Видалено")
  }

  const isFormOpen = creating || editingId !== null

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Лендінги</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Окрема сторінка на один товар для рекламних кампаній
          </p>
        </div>
        <Button onClick={startCreate} disabled={isFormOpen}>
          <Plus size={16} className="mr-1" /> Створити лендінг
        </Button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-4 max-h-[80vh] overflow-y-auto">
          <h3 className="font-bold text-lg">{editingId ? "Редагувати лендінг" : "Новий лендінг"}</h3>

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Slug (url)</label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="sekator-verano" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Заголовок H1</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Секатор Verano 205 мм" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Підзаголовок</label>
              <Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Японська сталь SK-5" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Назва товару (на сторінці)</label>
              <Input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} placeholder="Секатор Verano 71-814" />
            </div>
          </div>

          {/* Row 3 — prices */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Ціна (грн)</label>
              <Input type="number" value={form.productPrice} onChange={e => setForm({ ...form, productPrice: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Стара ціна (грн)</label>
              <Input type="number" value={form.productOldPrice} onChange={e => setForm({ ...form, productOldPrice: e.target.value })} placeholder="Не обов'язково" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Текст кнопки</label>
              <Input value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Кнопка</label>
                <input type="color" value={form.btnColor} onChange={e => setForm({ ...form, btnColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Фон</label>
                <input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Row 4 — description */}
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Опис товару</label>
            <textarea
              value={form.productDesc}
              onChange={e => setForm({ ...form, productDesc: e.target.value })}
              placeholder="Повний опис товару, характеристики..."
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
            />
          </div>

          {/* Row 5 — images */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Фото товару (URL)</label>
            <div className="flex gap-2">
              <Input value={newImgUrl} onChange={e => setNewImgUrl(e.target.value)} placeholder="https://images.prom.ua/3869195430.jpg" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addImage())} />
              <Button type="button" variant="outline" onClick={addImage}>Додати</Button>
            </div>
            {form.productImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.productImages.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[#0B53A4] text-white text-[9px] text-center rounded-b-lg py-0.5">Головне</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 6 — SEO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">SEO Title</label>
              <Input value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">SEO Description</label>
              <Input value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving}>{saving ? "Збереження..." : "Зберегти"}</Button>
            <Button variant="outline" onClick={cancel}>Відміна</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-muted-foreground p-8 text-center">Завантаження...</div>
      ) : landings.length === 0 ? (
        <div className="text-muted-foreground p-12 text-center bg-white rounded-2xl border">
          <p className="text-lg font-serif italic mb-2">Ще немає лендінгів</p>
          <p className="text-sm">Натисніть «Створити лендінг» щоб додати перший</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-[#F9F9F7] text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-left">
                <th className="p-4">Лендінг</th>
                <th className="p-4">Товар</th>
                <th className="p-4">Ціна</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Статус</th>
                <th className="p-4 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {landings.map(l => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{l.title}</td>
                  <td className="p-4 text-sm">{l.productName || "—"}</td>
                  <td className="p-4 text-sm font-bold">{l.productPrice > 0 ? `${l.productPrice} ₴` : "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground font-mono">/lp/{l.slug}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.isPublished ? 'Опубліковано' : 'Чернетка'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {l.isPublished && (
                        <a href={`/lp/${l.slug}`} target="_blank" className="p-2 hover:bg-muted rounded" title="Відкрити">
                          <ExternalLink size={14} className="text-blue-500" />
                        </a>
                      )}
                      <button onClick={() => startEdit(l)} className="p-2 hover:bg-muted rounded" title="Редагувати">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => togglePublish(l.id)} className="p-2 hover:bg-muted rounded" title={l.isPublished ? "Приховати" : "Опублікувати"}>
                        {l.isPublished ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => deleteLanding(l.id, l.title)} className="p-2 hover:bg-red-50 rounded" title="Видалити">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
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
