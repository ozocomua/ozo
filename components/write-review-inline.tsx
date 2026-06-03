"use client"

import { useState } from "react"
import { ReviewFormModal } from "@/components/review-form-modal"

export function WriteReviewInline({ productId }: { productId: number }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
      >
        Написати відгук
      </button>
      <ReviewFormModal open={open} onOpenChange={setOpen} productId={productId} />
    </>
  )
}
