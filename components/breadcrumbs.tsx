import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import JsonLd from "@/components/json-ld"

export type Crumb = {
  label: string
  href: string
}

function jsonLd(items: Crumb[]) {
  const list = items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.label,
    item: `${process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""}${item.href}`,
  }))

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list,
  }
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null

  return (
    <>
      <JsonLd data={jsonLd(items)} />
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <BreadcrumbItem key={i}>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                )}
              </BreadcrumbItem>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )
}
