import { NextResponse } from "next/server"
import { getPublishedPosts } from "@/lib/storefront-db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const skip = parseInt(searchParams.get("skip") || "0", 10)
  const take = parseInt(searchParams.get("take") || "12", 10)

  try {
    const posts = await getPublishedPosts({ limit: take, skip })
    return NextResponse.json({ posts })
  } catch (error) {
    console.error("API_POSTS_ERROR:", error)
    return NextResponse.json({ posts: [], error: "Помилка сервера" }, { status: 500 })
  }
}
