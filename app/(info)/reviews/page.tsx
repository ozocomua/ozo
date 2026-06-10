import prisma from "@/lib/prisma"
import type { Metadata } from "next"
import { StoreReviewsClient } from "./store-reviews-client"
import { ReviewsList } from "./reviews-list"

export const metadata: Metadata = {
  title: "Відгуки | OZO",
  description: "Відгуки клієнтів про обладнання OZO",
}

const INITIAL_TAKE = 20

export default async function ReviewsPage() {
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { isStoreReview: true, isPublished: true },
      orderBy: { createdAt: "desc" },
      take: INITIAL_TAKE,
    }),
    prisma.review.count({
      where: { isStoreReview: true, isPublished: true },
    }),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Відгуки</h1>

      <StoreReviewsClient />

      <ReviewsList initialReviews={reviews} total={total} />
    </div>
  )
}
