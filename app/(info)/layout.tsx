import { getTopCategories } from "@/lib/storefront-db"
import { InfoLayoutClient } from "./info-layout-client"

export default async function InfoLayout({ children }: { children: React.ReactNode }) {
  const categories = await getTopCategories()
  const headerCategories = categories.map((c) => ({ slug: c.slug, name: c.name }))

  return <InfoLayoutClient headerCategories={headerCategories}>{children}</InfoLayoutClient>
}
