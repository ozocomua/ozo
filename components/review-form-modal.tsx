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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { StarSelect } from "@/components/star-rating"
import { createReview } from "@/app/actions/catalog"

interface ReviewFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
}

export function ReviewFormModal({ open, onOpenChange, productId }: ReviewFormModalProps) {
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
        productId,
        rating,
        comment: comment.trim() || undefined,
        userName: userName.trim(),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Написати відгук</DialogTitle>
          <DialogDescription>
            Поділіться враженнями про товар
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              rows={4}
              className="resize-none"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-black text-white hover:bg-black/80"
          >
            {isPending ? "Відправка..." : "Відправити відгук"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
