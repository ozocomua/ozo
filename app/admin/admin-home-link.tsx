"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

function adminRootFromPathname(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/admin"
  const first = pathname.split("/").filter(Boolean)[0]
  return first ? `/${first}` : "/"
}

export function AdminHomeLink({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const href = adminRootFromPathname(pathname)
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

