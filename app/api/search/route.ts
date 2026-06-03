import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()

  if (q.length < 2) {
    return NextResponse.json({ products: [] })
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        oldPrice: true,
        images: {
          select: { url: true },
          orderBy: { sort: "asc" },
          take: 1,
        },
      },
    })

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        oldPrice: p.oldPrice,
        image: p.images[0]?.url ?? null,
      })),
    })
  } catch (error) {
    console.error("SEARCH_ERROR:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
