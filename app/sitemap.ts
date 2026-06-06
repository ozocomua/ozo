import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.product.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ]

  for (const c of categories) {
    entries.push({
      url: `${BASE_URL}/catalog/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  }

  for (const p of products) {
    entries.push({
      url: `${BASE_URL}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  }

  return entries
}
