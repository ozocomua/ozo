"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { slugify } from "@/lib/slug"

export async function createPost(data: {
  title: string
  slug?: string
  content: string
  excerpt?: string
  image?: string
  status: string
  metaTitle?: string
  metaDescription?: string
  productIds?: number[]
  ctaText?: string
  ctaUrl?: string
}) {
  try {
    const slug = data.slug || slugify(data.title)
    const existing = await prisma.post.findUnique({ where: { slug } })
    if (existing) return { success: false, error: "Стаття з таким slug вже існує" }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt ?? null,
        image: data.image ?? null,
        status: data.status,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        productIds: (data.productIds ?? []) as any,
        ctaText: data.ctaText ?? null,
        ctaUrl: data.ctaUrl ?? null,
      },
    })
    revalidatePath("/admin/blog")
    return { success: true, data: post }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Помилка створення" }
  }
}

export async function updatePost(
  id: number,
  data: {
    title?: string
    slug?: string
    content?: string
    excerpt?: string
    image?: string
    status?: string
    metaTitle?: string
    metaDescription?: string
    productIds?: number[]
    ctaText?: string
    ctaUrl?: string
  }
) {
  try {
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.content !== undefined) updateData.content = data.content
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt ?? null
    if (data.image !== undefined) updateData.image = data.image ?? null
    if (data.status !== undefined) updateData.status = data.status
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle ?? null
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription ?? null
    if (data.productIds !== undefined) updateData.productIds = data.productIds as any
    if (data.ctaText !== undefined) updateData.ctaText = data.ctaText ?? null
    if (data.ctaUrl !== undefined) updateData.ctaUrl = data.ctaUrl ?? null

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    })
    revalidatePath("/admin/blog")
    return { success: true, data: post }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Помилка оновлення" }
  }
}

export async function deletePost(id: number, confirmationTitle: string) {
  try {
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return { success: false, error: "Статтю не знайдено" }
    if (post.title !== confirmationTitle) return { success: false, error: "Назва не співпадає" }

    await prisma.post.delete({ where: { id } })
    revalidatePath("/admin/blog")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Помилка видалення" }
  }
}
