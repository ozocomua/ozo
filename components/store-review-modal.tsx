"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarSelect } from "@/components/star-rating"
import { createReview } from "@/app/actions/catalog"

interface StoreReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoreReviewModal({ open, onOpenChange }: StoreReviewModalProps) {
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(0)
  const [userName, setUserName] = useState("")
  const [comment, setComment] = useState("")

  const handleSubmit = () => {
    if (!userName.trim()) {
      toast.error("Вкажіть ваше ім'я")
      return
    }
    startTransition(async () => {
      const res = await createReview({
        rating,
        comment: comment.trim() || undefined,
        userName: userName.trim(),
        isStoreReview: true,
      })
      if (res.success) {
        toast.success("Дякуємо за відгук!")
        setUserName("")
        setComment("")
        setRating(0)
        onOpenChange(false)
      } else {
        toast.error(res.error || "Помилка")
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-background rounded-xl border border-border shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <div>
          <h3 className="text-lg font-semibold">Написати відгук</h3>
          <p className="text-sm text-muted-foreground mt-1">Поділіться враженнями про магазин OZO</p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Ваша оцінка</p>
          <StarSelect value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Обрано: {rating} / 5</p>
          )}
        </div>

        <div>
          <Input
            placeholder="Ваше ім'я"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        <div>
          <Textarea
            placeholder="Ваш відгук (необов'язково)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={4}
            className="resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right mt-1">
            {comment.length} / 2000
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white hover:from-[#0c5db8] hover:to-[#00c5e3]"
        >
          {isPending ? "Відправка..." : "Відправити відгук"}
        </Button>
      </div>
    </div>
  )
}
