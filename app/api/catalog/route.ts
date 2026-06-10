import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get("ids")
  if (!idsParam) {
    return NextResponse.json({ products: [] })
  }

  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0)

  if (!ids.length) {
    return NextResponse.json({ products: [] })
  }

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: ids.slice(0, 100) }, isPublished: true },
      select: { id: true, price: true, stock: true },
    })
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
