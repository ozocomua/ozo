import { prisma } from "@/lib/prisma"
import { CategoryForm } from "../category-form"

export default async function AdminNewCategoryPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
  return <CategoryForm category={{}} categories={categories} onSuccess={() => {}} />
}
