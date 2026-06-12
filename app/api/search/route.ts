import { NextResponse } from "next/server"
import { fuzzySearch } from "@/lib/search-service"
import { cached } from "@/lib/cache"

// Cache search results for 15 seconds (debounce-friendly, avoids DB spam)
const SEARCH_CACHE_TTL = 15_000

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()

  if (q.length < 2) {
    return NextResponse.json({ products: [], suggestion: null, fuzzy: false })
  }

  try {
    const cacheKey = `search:${q.toLowerCase()}`
    const result = await cached(cacheKey, SEARCH_CACHE_TTL, () => fuzzySearch(q))

    return NextResponse.json(result)
  } catch (error) {
    console.error("SEARCH_ERROR:", error)
    return NextResponse.json({ products: [], suggestion: null, fuzzy: false })
  }
}
