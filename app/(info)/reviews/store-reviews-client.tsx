"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StoreReviewModal } from "@/components/store-review-modal"

export function StoreReviewsClient() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setModalOpen(true)}
        className="border-black text-black hover:bg-black hover:text-white"
      >
        Написати відгук про магазин
      </Button>
      <StoreReviewModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
