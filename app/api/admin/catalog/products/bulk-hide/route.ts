import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const result = await prisma.product.updateMany({
      where: { isPublished: true },
      data: { isPublished: false },
    })
    return NextResponse.json({ success: true, count: result.count })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Помилка" }, { status: 500 })
  }
}
