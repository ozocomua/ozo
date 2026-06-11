import { prisma } from "@/lib/prisma"
import { CategoryForm } from "../category-form"

export default async function AdminEditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const categoryId = Number(id)

  const category = Number.isFinite(categoryId) ? await prisma.category.findUnique({ where: { id: categoryId } }) : null
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })

  return (
    <CategoryForm
      category={category ?? {}}
      categories={categories}
      onSuccess={() => {}}
    />
  )
}
