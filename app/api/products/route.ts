import { NextResponse } from "next/server"
import { getAllProducts, getProductsByCategoryId, getProductsByBrandSlug } from "@/lib/storefront-db"

function sortProducts(products: any[], sort: string): any[] {
  const sorted = [...products]
  switch (sort) {
    case "price_asc":
      sorted.sort((a: any, b: any) => a.price - b.price)
      break
    case "price_desc":
      sorted.sort((a: any, b: any) => b.price - a.price)
      break
    default:
      break
  }
  return sorted
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const skip = parseInt(searchParams.get("skip") || "0", 10)
  const take = parseInt(searchParams.get("take") || "24", 10)
  const categoryId = searchParams.get("categoryId")
  const brandSlug = searchParams.get("brandSlug")
  const sort = searchParams.get("sort") || ""

  try {
    let products

    if (categoryId) {
      const ids = categoryId.split(",").map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n))
      products = await getProductsByCategoryId(ids, { limit: take, skip })
    } else if (brandSlug) {
      products = await getProductsByBrandSlug(brandSlug, { limit: take, skip })
    } else {
      products = await getAllProducts({ limit: take, skip })
    }

    if (sort) {
      products = sortProducts(products, sort)
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error("API_PRODUCTS_ERROR:", error)
    return NextResponse.json({ products: [], error: "Помилка сервера" }, { status: 500 })
  }
}
