"use client"

import { useState } from "react"
import { StarRating } from "@/components/star-rating"
import { ReviewFormModal } from "@/components/review-form-modal"
import { Button } from "@/components/ui/button"

interface ReviewData {
  id: string
  rating: number
  comment: string | null
  userName: string
  createdAt: Date
}

interface ReviewsSectionProps {
  reviews: ReviewData[]
  avgRating: number
  reviewCount: number
  productId: number
  productName: string
}

export function ReviewsSection({ reviews, avgRating, reviewCount, productId, productName }: ReviewsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="border-t pt-6 mt-12 w-full">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Відгуки
          </h2>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={avgRating} size={14} />
              <span className="text-xs text-muted-foreground">
                {avgRating} ({reviewCount})
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6 pb-4">
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={r.rating} size={12} />
                    <span className="text-sm font-medium text-foreground">{r.userName}</span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{r.comment}</p>
                  )}
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-2">
                    {new Date(r.createdAt).toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Відгуків ще немає. Будьте першим!
            </p>
          )}

          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="border-[#00B5D1] text-[#00B5D1] hover:bg-gradient-to-r hover:from-[#0B53A4] hover:to-[#00B5D1] hover:text-white hover:border-transparent"
          >
            Написати відгук
          </Button>
        </div>
      </div>

      <ReviewFormModal open={modalOpen} onOpenChange={setModalOpen} productId={productId} />
    </>
  )
}
