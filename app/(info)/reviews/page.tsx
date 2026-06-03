import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { StoreReviewsClient } from "./store-reviews-client"

export const metadata: Metadata = {
  title: "Відгуки | Brosco Design",
  description: "Відгуки клієнтів про автохімію Brosco",
}

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

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { isStoreReview: true, isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Відгуки</h1>

      <StoreReviewsClient />

      {reviews.length === 0 && (
        <p className="text-muted-foreground">Відгуків ще немає.</p>
      )}

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
    </div>
  )
}
