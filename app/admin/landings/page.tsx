"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Landing = {
  id: number
  slug: string
  title: string
  productId: number
  product: { id: number; name: string }
  isPublished: boolean
  createdAt: string
}

export default function LandingsPage() {
  const router = useRouter()
  const [landings, setLandings] = useState<Landing[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [products, setProducts] = useState<{ id: number; name: string }[]>([])

  // Form state
  const [form, setForm] = useState({
    slug: "",
    title: "",
    subtitle: "",
    productId: "",
    ctaText: "Купити",
    bgColor: "#F9F9F7",
    btnColor: "#0B53A4",
    textColor: "#111111",
    metaTitle: "",
    metaDescription: "",
  })

  async function load() {
    setLoading(true)
    try {
      const [lRes, pRes] = await Promise.all([
        fetch("/api/admin/landings"),
        fetch("/api/admin/landings/products"),
      ])
      setLandings((await lRes.json()).landings ?? [])
      setProducts((await pRes.json()).products ?? [])
    } catch { /* */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.slug.trim() || !form.title.trim() || !form.productId) {
      toast.error("Slug, назва і товар обов'язкові")
      return
    }
    try {
      const res = await fetch("/api/admin/landings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Лендінг створено")
        setCreating(false)
        load()
      } else {
        toast.error(data.error || "Помилка")
      }
    } catch { toast.error("Мережева помилка") }
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Лендінги</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Окрема сторінка на один товар для рекламних кампаній
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={creating}>
          <Plus size={16} className="mr-1" /> Створити лендінг
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-4">
          <h3 className="font-bold text-lg">Новий лендінг</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Slug (url)</label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="nasos-dlya-vody" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Заголовок</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Найкращий насос" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Підзаголовок</label>
              <Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Короткий опис" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Товар</label>
              <select
                value={form.productId}
                onChange={e => setForm({ ...form, productId: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Оберіть товар...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Текст кнопки</label>
              <Input value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Колір кнопки</label>
                <input
                  type="color"
                  value={form.btnColor}
                  onChange={e => setForm({ ...form, btnColor: e.target.value })}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Колір фону</label>
                <input
                  type="color"
                  value={form.bgColor}
                  onChange={e => setForm({ ...form, bgColor: e.target.value })}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Колір тексту</label>
                <input
                  type="color"
                  value={form.textColor}
                  onChange={e => setForm({ ...form, textColor: e.target.value })}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
              </div>
            </div>
          </div>
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
          <div className="flex gap-2">
            <Button onClick={create}>Зберегти</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Відміна</Button>
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
                <th className="p-4">Slug</th>
                <th className="p-4">Статус</th>
                <th className="p-4 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {landings.map(l => (
                <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{l.title}</td>
                  <td className="p-4 text-sm text-muted-foreground">{l.product?.name ?? "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground font-mono">/lp/{l.slug}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.isPublished ? 'Опубліковано' : 'Чернетка'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {l.isPublished && (
                        <a href={`/lp/${l.slug}`} target="_blank" className="p-2 hover:bg-muted rounded transition-colors" title="Відкрити">
                          <ExternalLink size={14} className="text-blue-500" />
                        </a>
                      )}
                      <button onClick={() => togglePublish(l.id)} className="p-2 hover:bg-muted rounded transition-colors" title={l.isPublished ? "Приховати" : "Опублікувати"}>
                        {l.isPublished ? <Eye size={14} className="text-green-600" /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => deleteLanding(l.id, l.title)} className="p-2 hover:bg-red-50 rounded transition-colors" title="Видалити">
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
