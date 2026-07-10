import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const landings = await prisma.landingPage.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ landings })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { slug, title, subtitle, productId, ctaText, bgColor, btnColor, textColor, metaTitle, metaDescription } = body

  if (!slug?.trim() || !title?.trim() || !productId) {
    return NextResponse.json({ error: "slug, title, productId are required" }, { status: 400 })
  }

  const existing = await prisma.landingPage.findUnique({ where: { slug: slug.trim() } })
  if (existing) {
    return NextResponse.json({ error: "Цей slug вже зайнято" }, { status: 400 })
  }

  const landing = await prisma.landingPage.create({
    data: {
      slug: slug.trim(),
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      productId: Number(productId),
      ctaText: ctaText?.trim() || "Купити",
      bgColor: bgColor || "#F9F9F7",
      btnColor: btnColor || "#0B53A4",
      textColor: textColor || "#111111",
      metaTitle: metaTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
    },
  })

  return NextResponse.json({ success: true, landing })
}
