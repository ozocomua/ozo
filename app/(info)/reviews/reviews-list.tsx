"use client"

import { useState } from "react"

function StarSvg({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.73 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
        fill={filled ? "black" : "transparent"}
        stroke="black"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface Review {
  id: string
  rating: number
  userName: string
  comment: string | null
  createdAt: string | Date
}

export function ReviewsList({ initialReviews, total }: { initialReviews: Review[]; total: number }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const hasMore = reviews.length < total

  const loadMore = async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const res = await fetch(`/api/reviews?page=${nextPage}&take=20`)
      const data = await res.json()
      if (Array.isArray(data.reviews)) {
        setReviews((prev) => [...prev, ...data.reviews])
        setPage(nextPage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (reviews.length === 0) {
    return <p className="text-muted-foreground">Отзывов пока нет.</p>
  }

  return (
    <>
      <div className="space-y-5">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-border pb-5 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              {r.rating > 0 && (
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarSvg key={star} filled={star <= r.rating} />
                  ))}
                </div>
              )}
              <span className="text-sm font-medium">{r.userName}</span>
            </div>
            {r.comment && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">{r.comment}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              {new Date(r.createdAt).toLocaleDateString("uk-UA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="border border-[#00B5D1] text-[#00B5D1] hover:bg-gradient-to-r hover:from-[#0B53A4] hover:to-[#00B5D1] hover:text-white hover:border-transparent transition-all px-6 sm:px-8 py-2.5 sm:py-3 text-sm uppercase tracking-wider font-medium"
          >
            {loading ? "Завантаження..." : "Завантажити ще"}
          </button>
        </div>
      )}
    </>
  )
}
