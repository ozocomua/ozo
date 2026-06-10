import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1", 10)
  const take = Math.min(parseInt(searchParams.get("take") || "20", 10), 100)
  const skip = (page - 1) * take

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { isStoreReview: true, isPublished: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.review.count({
        where: { isStoreReview: true, isPublished: true },
      }),
    ])

    return NextResponse.json({ reviews, total, page, take })
  } catch (error) {
    console.error("API_REVIEWS_ERROR:", error)
    return NextResponse.json({ reviews: [], total: 0, error: "Помилка сервера" }, { status: 500 })
  }
}
