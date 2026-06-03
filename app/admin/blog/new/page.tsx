import { PostForm } from "../post-form"
import prisma from "@/lib/prisma"

export const metadata = { title: "Нова стаття | Адмін панель" }
export const dynamic = "force-dynamic"

export default async function NewPostPage() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PostForm products={products} />
    </div>
  )
}
