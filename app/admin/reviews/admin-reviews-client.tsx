"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { publishReview, unpublishReview, deleteReview } from "@/app/actions/catalog"

type Review = {
  id: string
  rating: number
  comment: string | null
  userName: string
  productId: number | null
  isStoreReview: boolean
  isPublished: boolean
  createdAt: Date
  product: { id: number; name: string; slug: string } | null
}

export function AdminReviewsClient({ reviews: initial }: { reviews: Review[] }) {
  const [reviews, setReviews] = useState(initial)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handlePublish = (id: string) => {
    startTransition(async () => {
      const res = await publishReview(id)
      if (res.success) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished: true } : r)))
        toast.success("Опубліковано")
      } else {
        toast.error(res.error || "Помилка")
      }
    })
  }

  const handleUnpublish = (id: string) => {
    startTransition(async () => {
      const res = await unpublishReview(id)
      if (res.success) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished: false } : r)))
        toast.success("Приховано")
      } else {
        toast.error(res.error || "Помилка")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteReview(id)
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id))
        setDeleteId(null)
        toast.success("Видалено")
      } else {
        toast.error(res.error || "Помилка")
      }
    })
  }

  return (
    <>
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Ім'я</th>
              <th className="px-4 py-3">Оцінка</th>
              <th className="px-4 py-3">Текст</th>
              <th className="px-4 py-3">Товар</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.isStoreReview ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                    {r.isStoreReview ? "Магазин" : "Товар"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{r.userName}</td>
                <td className="px-4 py-3">{r.rating > 0 ? `${r.rating} ⭐` : "—"}</td>
                <td className="px-4 py-3 max-w-[250px] truncate text-muted-foreground">
                  {r.comment || "—"}
                </td>
                <td className="px-4 py-3 max-w-[150px] truncate">
                  {r.product ? (
                    <a href={`/product/${r.product.slug}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                      {r.product.name}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.isPublished ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {r.isPublished ? "Опубл." : "На модерації"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString("uk-UA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {r.isPublished ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleUnpublish(r.id)}
                        className="h-7 text-[11px] px-2"
                      >
                        Приховати
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handlePublish(r.id)}
                        className="h-7 text-[11px] px-2 border-green-600 text-green-600 hover:bg-green-50"
                      >
                        Опублікувати
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => setDeleteId(r.id)}
                      className="h-7 text-[11px] px-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Видалити
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити відгук?</DialogTitle>
            <DialogDescription>
              Цю дію не можна скасувати. Відгук буде видалено назавжди.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Скасувати
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
