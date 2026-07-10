import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const landings = await prisma.landingPage.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ landings })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { slug, title, subtitle, productName, productDesc, productPrice, productOldPrice, productImage, productImages, ctaText, bgColor, btnColor, textColor, metaTitle, metaDescription } = body

  if (!slug?.trim() || !title?.trim()) {
    return NextResponse.json({ error: "slug, title are required" }, { status: 400 })
  }

  const existing = await prisma.landingPage.findUnique({ where: { slug: slug.trim() } })
  if (existing) return NextResponse.json({ error: "Цей slug вже зайнято" }, { status: 400 })

  const landing = await prisma.landingPage.create({
    data: {
      slug: slug.trim(),
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      productName: productName?.trim() || "",
      productDesc: productDesc?.trim() || null,
      productPrice: productPrice ? Number(productPrice) : 0,
      productOldPrice: productOldPrice ? Number(productOldPrice) : null,
      productImage: productImage?.trim() || null,
      productImages: Array.isArray(productImages) ? productImages : [],
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

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, slug, title, subtitle, productName, productDesc, productPrice, productOldPrice, productImage, productImages, ctaText, bgColor, btnColor, textColor, metaTitle, metaDescription } = body

  if (!id || !slug?.trim() || !title?.trim()) {
    return NextResponse.json({ error: "id, slug, title are required" }, { status: 400 })
  }

  const conflict = await prisma.landingPage.findFirst({ where: { slug: slug.trim(), id: { not: Number(id) } } })
  if (conflict) return NextResponse.json({ error: "Цей slug вже зайнято" }, { status: 400 })

  await prisma.landingPage.update({
    where: { id: Number(id) },
    data: {
      slug: slug.trim(),
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      productName: productName?.trim() || "",
      productDesc: productDesc?.trim() || null,
      productPrice: productPrice ? Number(productPrice) : 0,
      productOldPrice: productOldPrice ? Number(productOldPrice) : null,
      productImage: productImage?.trim() || null,
      productImages: Array.isArray(productImages) ? productImages : [],
      ctaText: ctaText?.trim() || "Купити",
      bgColor: bgColor || "#F9F9F7",
      btnColor: btnColor || "#0B53A4",
      textColor: textColor || "#111111",
      metaTitle: metaTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
    },
  })
  return NextResponse.json({ success: true })
}
