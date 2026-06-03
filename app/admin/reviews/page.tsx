import prisma from "@/lib/prisma"
import { AdminReviewsClient } from "./admin-reviews-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Відгуки | Адмін панель",
}

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: { id: true, name: true, slug: true },
      },
    },
    take: 100,
  })

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Відгуки</h2>
      </div>
      <AdminReviewsClient reviews={reviews} />
    </div>
  )
}
