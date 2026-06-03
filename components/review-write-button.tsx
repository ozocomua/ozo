"use client"

import { useState } from "react"
import { ReviewFormModal } from "@/components/review-form-modal"
import { StarRating } from "@/components/star-rating"

interface ReviewsWriteButtonProps {
  productId: number
  rating: number
  count: number
}

export function ReviewsWriteButton({ productId, rating, count }: ReviewsWriteButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {count > 0 ? (
          <>
            <StarRating rating={rating} size={12} />
            <span>({count})</span>
          </>
        ) : (
          <span>Написати відгук</span>
        )}
      </button>
      <ReviewFormModal open={open} onOpenChange={setOpen} productId={productId} />
    </>
  )
}
