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
        className="border-[#00B5D1] text-[#00B5D1] hover:bg-gradient-to-r hover:from-[#0B53A4] hover:to-[#00B5D1] hover:text-white hover:border-transparent"
      >
        Написати відгук про магазин
      </Button>
      <StoreReviewModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
