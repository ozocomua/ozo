import { BrandForm } from "../brand-form"

export const dynamic = "force-dynamic"

export default async function AdminEditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const brandId = Number(id)
  return <BrandForm mode="edit" brandId={Number.isFinite(brandId) ? brandId : undefined} />
}

