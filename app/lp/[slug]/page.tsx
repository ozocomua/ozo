import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import LandingClient from "./landing-client"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const lp = await prisma.landingPage.findUnique({
    where: { slug, isPublished: true },
    select: { metaTitle: true, metaDescription: true, title: true },
  })
  if (!lp) return { title: "Сторінку не знайдено" }
  return {
    title: lp.metaTitle || lp.title,
    description: lp.metaDescription || "",
    robots: { index: true, follow: true },
  }
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lp = await prisma.landingPage.findUnique({
    where: { slug, isPublished: true },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          fullDescription: true,
          price: true,
          oldPrice: true,
          stock: true,
          sku: true,
          images: { select: { url: true, sort: true, isMain: true }, orderBy: { sort: "asc" } },
          variants: { select: { id: true, sku: true, size: true, volume: true, packageType: true, priceRetail: true, stock: true }, orderBy: { id: "asc" } },
        },
      },
    },
  })

  if (!lp) notFound()

  return <LandingClient landing={lp} />
}
