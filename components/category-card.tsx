import Link from "next/link"
import Image from "next/image"

export type CategoryCardData = {
  slug: string
  name: string
  imageUrl: string
  description: string
}

interface CategoryCardProps {
  category: CategoryCardData
}

function resolveSrc(raw: string, slug: string): string {
  let src = raw || "/placeholder.jpg"
  if (src.startsWith("/uploads/")) {
    src = `/api/image/${src.replace("/uploads/", "")}`
  }
  return `${src}?v=${slug}`
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/catalog/${category.slug}`}
      className="group relative overflow-hidden rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={resolveSrc(category.imageUrl, category.slug)}
          alt={category.name}
          fill
          unoptimized
          className="object-cover transition-all duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-medium text-white text-sm sm:text-base leading-tight">
            {category.name}
          </h3>
        </div>
      </div>
    </Link>
  )
}
