"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, X, Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Landing = {
  id: number; slug: string; title: string; subtitle: string | null
  productName: string; productDesc: string | null; productPrice: number; productOldPrice: number | null
  productImage: string | null; productImages: string[]
  ctaText: string; bgColor: string; btnColor: string; textColor: string
  metaTitle: string | null; metaDescription: string | null
  reviews: any[]; advantages: any[]; useCases: any[]; stockCount: number; discountPercent: number
  isPublished: boolean
}

const emptyForm = {
  slug: "", title: "", subtitle: "", productName: "", productDesc: "",
  productPrice: "0", productOldPrice: "", productImage: "", productImages: [] as string[],
  ctaText: "Купити", bgColor: "#F9F9F7", btnColor: "#0B53A4", textColor: "#111111",
  metaTitle: "", metaDescription: "",
  reviews: [] as {name:string;city:string;text:string;avatar:string;rating:number}[],
  advantages: [] as {icon:string;title:string;desc:string}[],
  useCases: [] as string[],
  stockCount: "50", discountPercent: "47",
}

const AVAILABLE_ICONS = ["Scissors","Sprout","Shield","Check","Truck","Zap","Star","Award","Droplets","Wrench","Clock","Phone"] as const

export default function LandingsPage() {
  const [landings, setLandings] = useState<Landing[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newUseCase, setNewUseCase] = useState("")

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/landings")
      setLandings((await res.json()).landings ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function startEdit(l: Landing) {
    setEditingId(l.id); setCreating(false)
    setForm({
      slug: l.slug, title: l.title, subtitle: l.subtitle || "",
      productName: l.productName || "", productDesc: l.productDesc || "",
      productPrice: String(l.productPrice || 0), productOldPrice: l.productOldPrice ? String(l.productOldPrice) : "",
      productImage: l.productImage || "", productImages: Array.isArray(l.productImages) ? l.productImages : [],
      ctaText: l.ctaText, bgColor: l.bgColor, btnColor: l.btnColor, textColor: l.textColor,
      metaTitle: l.metaTitle || "", metaDescription: l.metaDescription || "",
      reviews: Array.isArray(l.reviews) ? l.reviews : [],
      advantages: Array.isArray(l.advantages) ? l.advantages : [],
      useCases: Array.isArray(l.useCases) ? l.useCases : [],
      stockCount: String(l.stockCount ?? 50), discountPercent: String(l.discountPercent ?? 47),
    })
  }

  function startCreate() { setCreating(true); setEditingId(null); setForm(emptyForm) }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files?.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData(); fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (data.success && data.url) newUrls.push(data.url)
        else toast.error(data.error || "Помилка завантаження")
      } catch { toast.error("Мережева помилка") }
    }
    if (newUrls.length) {
      setForm(f => ({ ...f, productImages: [...f.productImages, ...newUrls], productImage: f.productImage || newUrls[0] }))
      toast.success(`Завантажено ${newUrls.length} фото`)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeImage(idx: number) {
    const arr = form.productImages.filter((_, i) => i !== idx)
    setForm({ ...form, productImages: arr, productImage: arr[0] || "" })
  }

  async function save() {
    if (!form.slug.trim() || !form.title.trim()) { toast.error("Slug і заголовок обов'язкові"); return }
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
        setCreating(false); setEditingId(null); setForm(emptyForm); load()
      } else toast.error(data.error || "Помилка")
    } catch { toast.error("Мережева помилка") }
    finally { setSaving(false) }
  }

  function cancel() { setCreating(false); setEditingId(null); setForm(emptyForm) }

  async function togglePublish(id: number) { await fetch(`/api/admin/landings/${id}/toggle`, { method: "POST" }); load() }
  async function deleteLanding(id: number, title: string) {
    if (!confirm(`Видалити лендінг «${title}»?`)) return
    await fetch(`/api/admin/landings/${id}`, { method: "DELETE" }); load(); toast.success("Видалено")
  }

  const isFormOpen = creating || editingId !== null

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Лендінги</h2><p className="text-sm text-muted-foreground mt-1">Окрема сторінка на один товар для рекламних кампаній</p></div>
        <Button onClick={startCreate} disabled={isFormOpen}><Plus size={16} className="mr-1" /> Створити лендінг</Button>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-4 max-h-[80vh] overflow-y-auto">
          <h3 className="font-bold text-lg">{editingId ? "Редагувати лендінг" : "Новий лендінг"}</h3>

          {/* Basic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Slug (url)</label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="sekator-verano" /></div>
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Заголовок H1</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Секатор Verano 205 мм" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Підзаголовок</label><Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Японська сталь SK-5" /></div>
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Назва товару</label><Input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} placeholder="Секатор Verano 71-814" /></div>
          </div>

          {/* Prices, CTA, Colors */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Ціна (грн)</label><Input type="number" value={form.productPrice} onChange={e => setForm({ ...form, productPrice: e.target.value })} /></div>
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Стара ціна</label><Input type="number" value={form.productOldPrice} onChange={e => setForm({ ...form, productOldPrice: e.target.value })} placeholder="Не обов'язково" /></div>
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Текст кнопки</label><Input value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} /></div>
            <div className="flex gap-2 items-end">
              <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Кнопка</label><input type="color" value={form.btnColor} onChange={e => setForm({ ...form, btnColor: e.target.value })} className="w-8 h-8 rounded border" /></div>
              <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Фон</label><input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-8 h-8 rounded border" /></div>
            </div>
          </div>

          {/* Stock & Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Залишок (шт)</label><Input type="number" value={form.stockCount} onChange={e => setForm({ ...form, stockCount: e.target.value })} /></div>
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Знижка (%)</label><Input type="number" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: e.target.value })} /></div>
          </div>

          {/* Description */}
          <div><label className="text-[10px] font-bold uppercase text-muted-foreground">Опис товару</label><textarea value={form.productDesc} onChange={e => setForm({ ...form, productDesc: e.target.value })} placeholder="Повний опис..." className="w-full h-32 rounded-md border px-3 py-2 text-sm resize-y" /></div>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Фото товару</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <><Loader2 size={14} className="animate-spin mr-1" /> Завантаження...</> : <><Upload size={14} className="mr-1" /> Завантажити фото</>}
              </Button>
              <span className="text-xs text-muted-foreground self-center">JPEG, PNG, WebP — max 10 MB</span>
            </div>
            {form.productImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.productImages.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100"><X size={10} /></button>
                    {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-[#0B53A4] text-white text-[9px] text-center rounded-b-lg py-0.5">Головне</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advantages */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Переваги</label>
            {form.advantages.map((a, i) => (
              <div key={i} className="bg-secondary rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <select value={a.icon} onChange={e => { const u = [...form.advantages]; u[i] = {...u[i], icon: e.target.value}; setForm({...form, advantages: u}) }} className="h-9 rounded-md border px-2 text-sm w-32">
                    <option value="">Іконка...</option>
                    {AVAILABLE_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <Input placeholder="Заголовок" value={a.title} onChange={e => { const u = [...form.advantages]; u[i] = {...u[i], title: e.target.value}; setForm({...form, advantages: u}) }} className="flex-1" />
                  <button onClick={() => setForm({...form, advantages: form.advantages.filter((_,j) => j!==i)})} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
                <Input placeholder="Опис" value={a.desc} onChange={e => { const u = [...form.advantages]; u[i] = {...u[i], desc: e.target.value}; setForm({...form, advantages: u}) }} />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setForm({...form, advantages: [...form.advantages, {icon:"Check",title:"",desc:""}]})}><Plus size={14} className="mr-1" /> Додати перевагу</Button>
          </div>

          {/* Use Cases */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Для чого підходить</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.useCases.map((uc, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-secondary text-sm rounded-full px-3 py-1">
                  {uc}
                  <button onClick={() => setForm({...form, useCases: form.useCases.filter((_,j) => j!==i)})} className="text-muted-foreground hover:text-red-500"><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newUseCase} onChange={e => setNewUseCase(e.target.value)} placeholder="🍇 Винограду" onKeyDown={e => e.key === "Enter" && (setForm({...form, useCases: [...form.useCases, newUseCase]}), setNewUseCase(""))} />
              <Button type="button" variant="outline" onClick={() => { if(newUseCase.trim()) { setForm({...form, useCases: [...form.useCases, newUseCase.trim()]}); setNewUseCase(""); } }}>Додати</Button>
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Відгуки</label>
            {form.reviews.map((r, i) => (
              <div key={i} className="bg-secondary rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {r.avatar ? <img src={r.avatar} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B53A4] to-[#00B5D1] flex items-center justify-center text-white font-bold text-xs">{r.name?.[0] || "?"}</div>}
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input placeholder="Ім'я" value={r.name} onChange={e => { const u = [...form.reviews]; u[i] = {...u[i], name: e.target.value}; setForm({...form, reviews: u}) }} />
                    <Input placeholder="Місто" value={r.city} onChange={e => { const u = [...form.reviews]; u[i] = {...u[i], city: e.target.value}; setForm({...form, reviews: u}) }} />
                  </div>
                  <button onClick={() => setForm({...form, reviews: form.reviews.filter((_,j) => j!==i)})} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="URL аватарки" value={r.avatar} onChange={e => { const u = [...form.reviews]; u[i] = {...u[i], avatar: e.target.value}; setForm({...form, reviews: u}) }} className="flex-1" />
                  <select value={r.rating || 5} onChange={e => { const u = [...form.reviews]; u[i] = {...u[i], rating: Number(e.target.value)}; setForm({...form, reviews: u}) }} className="w-16 h-10 rounded-md border px-2 text-sm">{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}★</option>)}</select>
                </div>
                <textarea placeholder="Текст відгуку..." value={r.text} onChange={e => { const u = [...form.reviews]; u[i] = {...u[i], text: e.target.value}; setForm({...form, reviews: u}) }} className="w-full h-16 rounded-md border px-3 py-2 text-sm resize-y" />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setForm({...form, reviews: [...form.reviews, {name:"",city:"",text:"",avatar:"",rating:5}]})}><Plus size={14} className="mr-1" /> Додати відгук</Button>
          </div>

          {/* SEO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">SEO Title</label><Input value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} /></div>
            <div><label className="text-[10px] font-bold uppercase text-muted-foreground">SEO Description</label><Input value={form.metaDescription} onChange={e => setForm({ ...form, metaDescription: e.target.value })} /></div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving}>{saving ? "Збереження..." : "Зберегти"}</Button>
            <Button variant="outline" onClick={cancel}>Відміна</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <div className="text-muted-foreground p-8 text-center">Завантаження...</div> : landings.length === 0 ? (
        <div className="text-muted-foreground p-12 text-center bg-white rounded-2xl border"><p className="text-lg font-serif italic mb-2">Ще немає лендінгів</p><p className="text-sm">Натисніть «Створити лендінг»</p></div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b bg-[#F9F9F7] text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-left"><th className="p-4">Лендінг</th><th className="p-4">Товар</th><th className="p-4">Ціна</th><th className="p-4">Slug</th><th className="p-4">Статус</th><th className="p-4 text-right">Дії</th></tr></thead>
            <tbody className="divide-y">
              {landings.map(l => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{l.title}</td><td className="p-4 text-sm">{l.productName || "—"}</td><td className="p-4 text-sm font-bold">{l.productPrice > 0 ? `${l.productPrice} ₴` : "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground font-mono">/lp/{l.slug}</td>
                  <td className="p-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{l.isPublished ? 'Опубліковано' : 'Чернетка'}</span></td>
                  <td className="p-4 text-right"><div className="flex items-center justify-end gap-1">
                    {l.isPublished && <a href={`/lp/${l.slug}`} target="_blank" className="p-2 hover:bg-muted rounded"><ExternalLink size={14} className="text-blue-500" /></a>}
                    <button onClick={() => startEdit(l)} className="p-2 hover:bg-muted rounded"><Pencil size={14} /></button>
                    <button onClick={() => togglePublish(l.id)} className="p-2 hover:bg-muted rounded">{l.isPublished ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} />}</button>
                    <button onClick={() => deleteLanding(l.id, l.title)} className="p-2 hover:bg-red-50 rounded"><Trash2 size={14} className="text-red-500" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
