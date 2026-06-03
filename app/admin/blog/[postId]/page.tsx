import { notFound } from "next/navigation"
import { PostForm } from "../post-form"
import prisma from "@/lib/prisma"

export const metadata = { title: "Редагувати статтю | Адмін панель" }
export const dynamic = "force-dynamic"

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const id = parseInt(postId, 10)
  if (isNaN(id)) return notFound()

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return notFound()

  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PostForm post={JSON.parse(JSON.stringify(post))} products={products} />
    </div>
  )
}
