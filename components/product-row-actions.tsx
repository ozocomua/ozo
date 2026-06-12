"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Copy, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function ProductRowActions({
  productId,
  initialPublished,
}: {
  productId: number
  initialPublished: boolean
}) {
  const router = useRouter()
  const [published, setPublished] = useState(initialPublished)
  const [busy, setBusy] = useState<string | null>(null)

  const toggleVisibility = async () => {
    setBusy("toggle")
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/toggle-visibility`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setPublished(data.isPublished)
        toast.success(data.isPublished ? "Товар показано" : "Товар приховано")
      }
    } catch { /* ignore */ }
    setBusy(null)
  }

  const duplicate = async () => {
    setBusy("dup")
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/duplicate`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success("Товар дубльовано")
        router.refresh()
      } else {
        toast.error(data.error || "Не вдалося")
      }
    } catch { /* ignore */ }
    setBusy(null)
  }

  const handleDelete = () => {
    const answer = window.prompt(`Видалити товар #${productId}? Введіть DELETE для підтвердження.`)
    if (answer !== "DELETE") return
    setBusy("del")
    fetch(`/api/admin/catalog/products/${productId}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          toast.success("Товар видалено")
          router.refresh()
        } else {
          toast.error(data.error || "Не вдалося видалити")
        }
      })
      .catch(() => toast.error("Помилка"))
      .finally(() => setBusy(null))
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => router.push(`./products/${productId}`)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Редагувати"
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={duplicate}
        disabled={busy === "dup"}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="Дублювати"
      >
        <Copy size={15} />
      </button>
      <button
        onClick={toggleVisibility}
        disabled={busy === "toggle"}
        className={`p-1.5 rounded-lg transition-colors ${
          published
            ? "text-green-600 bg-green-50 hover:bg-green-100"
            : "text-muted-foreground bg-muted hover:bg-border"
        }`}
        title={published ? "Приховати" : "Показати"}
      >
        {published ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <button
        onClick={handleDelete}
        disabled={busy === "del"}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Видалити"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
