import { CategoryForm } from "../category-form"

export default async function AdminEditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const categoryId = Number(id)
  return <CategoryForm mode="edit" categoryId={Number.isFinite(categoryId) ? categoryId : undefined} />
}

