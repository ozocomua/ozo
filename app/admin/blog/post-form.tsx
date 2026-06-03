"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SingleImageUploader } from "@/components/catalog/single-image-uploader"

const RichTextEditor = dynamic(() => import("@/components/rich-text-editor"), {
  ssr: false,
  loading: () => <div className="min-h-[400px] border rounded-md bg-secondary animate-pulse" />,
})

interface ProductLinkEditorProps {
  value: number[]
  products: any[]
  onChange: (ids: number[]) => void
}

function ProductLinkEditor({ value, products, onChange }: ProductLinkEditorProps) {
  const [q, setQ] = useState("")

  const filtered = products
    .filter((p) => (q.trim() ? p.name.toLowerCase().includes(q.trim().toLowerCase()) : true))
    .slice(0, 20)

  return (
    <div className="space-y-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Пошук товарів..."
        className="text-xs"
      />
      <div className="max-h-[120px] overflow-auto border rounded-md p-2 space-y-1">
        {filtered.map((p) => (
          <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted rounded px-1 py-0.5">
            <input
              type="checkbox"
              checked={value.includes(p.id)}
              onChange={() =>
                onChange(value.includes(p.id) ? value.filter((x) => x !== p.id) : [...value, p.id])
              }
            />
            <span className="truncate">{p.name}</span>
          </label>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground">Вибрано: {value.length}</div>
    </div>
  )
}

interface PostFormProps {
  post?: any
  products: any[]
}

export function PostForm({ post, products }: PostFormProps) {
  const [title, setTitle] = useState(post?.title ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [image, setImage] = useState(post?.image ?? "")
  const [status, setStatus] = useState(post?.status ?? "DRAFT")
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "")
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "")
  const [productIds, setProductIds] = useState<number[]>((post?.productIds as number[]) ?? [])
  const [ctaText, setCtaText] = useState(post?.ctaText ?? "")
  const [ctaUrl, setCtaUrl] = useState(post?.ctaUrl ?? "")
  const [saving, setSaving] = useState(false)
  const [deleteTitle, setDeleteTitle] = useState("")
  const backToList = () => {
    const dest = window.location.pathname.replace(/\/[^/]+$/, "")
    window.location.href = dest
  }
  const isNew = !post?.id

  const handleSave = async (action: "DRAFT" | "PUBLISHED") => {
    setSaving(true)
    const { createPost, updatePost } = await import("@/app/actions/posts")
    const data = {
      title,
      slug: slug || undefined,
      content,
      excerpt: excerpt || undefined,
      image: image || undefined,
      status: action,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      productIds: productIds.length > 0 ? productIds : undefined,
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || undefined,
    }

    const res = isNew
      ? await createPost(data)
      : await updatePost(post.id, data)

    if (res.success) {
      backToList()
    } else {
      alert(res.error || "Помилка")
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteTitle.trim()) return
    if (!confirm("Точно видалити?")) return
    const { deletePost } = await import("@/app/actions/posts")
    const res = await deletePost(post.id, deleteTitle.trim())
    if (res.success) {
      backToList()
    } else {
      alert(res.error || "Помилка")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {isNew ? "Нова стаття" : "Редагування статті"}
        </h3>
        <div className="flex gap-2">
          {!isNew && (
            <Button type="button" variant="ghost" onClick={handleSave.bind(null, "PUBLISHED")} disabled={saving}>
              {saving ? "..." : "Опублікувати"}
            </Button>
          )}
          <Button type="button" onClick={handleSave.bind(null, "PUBLISHED")} disabled={saving}>
            {saving ? "Збереження..." : "Зберегти та опублікувати"}
          </Button>
          <Button type="button" variant="outline" onClick={handleSave.bind(null, "DRAFT")} disabled={saving}>
            {saving ? "..." : "Чернетка"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Назва *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок статті" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Slug (URL)</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-statti" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Контент *</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Почніть писати статтю..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Короткий опис</label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="1-2 речення для картки статті"
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Обкладинка</label>
            <SingleImageUploader value={image} onChange={setImage} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="DRAFT">Чернетка</option>
              <option value="PUBLISHED">Опубліковано</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Товари в статті</label>
            <ProductLinkEditor value={productIds} products={products} onChange={setProductIds} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Текст CTA-кнопки</label>
            <Input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Купити зараз"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Посилання CTA</label>
            <Input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="/product/slug"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">SEO</h4>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Meta Title</label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="[Назва] | Brosco"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Meta Description</label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Опис для пошуковиків"
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {!isNew && (
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-sm font-semibold text-red-600">Видалити</h4>
              <Input
                value={deleteTitle}
                onChange={(e) => setDeleteTitle(e.target.value)}
                placeholder={`Введіть «${post.title}» для підтвердження`}
              />
              <Button
                type="button"
                variant="destructive"
                disabled={deleteTitle.trim() !== post.title}
                onClick={handleDelete}
                className="w-full"
              >
                Видалити статтю
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
