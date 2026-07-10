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
  })

  if (!lp) notFound()

  const data = {
    ...lp,
    productImages: Array.isArray((lp as any).productImages) ? (lp as any).productImages as string[] : [],
  }

  return <LandingClient landing={data} />
}
