"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type NavItem = { key: string; label: string; segment: string }

const sections: NavItem[] = [
  { key: "orders", label: "Замовлення", segment: "" },
  { key: "callbacks", label: "Заявки на дзвінок", segment: "callbacks" },
  { key: "catalog", label: "Каталог", segment: "catalog" },
  { key: "blog", label: "Блог", segment: "blog" },
  { key: "reviews", label: "Відгуки", segment: "reviews" },
  { key: "calculator", label: "Калькулятор", segment: "profit-calculator" },
  { key: "finance", label: "Фінанси", segment: "finance-control" },
  { key: "settings", label: "Налаштування", segment: "settings" },
]

const orders: NavItem[] = [
  { key: "all", label: "Всі", segment: "all" },
  { key: "new", label: "Нові", segment: "" },
  { key: "packed", label: "Упаковані", segment: "packed" },
  { key: "shipped", label: "Відправлені", segment: "shipped" },
  { key: "refused", label: "Відмови", segment: "refused" },
  { key: "received", label: "Отримані", segment: "received" },
]

const catalog: NavItem[] = [
  { key: "products", label: "Товари", segment: "catalog" },
  { key: "categories", label: "Категорії", segment: "catalog/categories" },
  { key: "brands", label: "Бренди", segment: "catalog/brands" },
]

const reviewsSub: NavItem[] = [
  { key: "all", label: "Всі", segment: "reviews" },
]

function adminRootFromPathname(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/admin"
  const first = pathname.split("/").filter(Boolean)[0]
  return first ? `/${first}` : "/"
}

export { adminRootFromPathname }

function normalizePath(p: string): string {
  if (p.length <= 1) return p
  return p.endsWith("/") ? p.slice(0, -1) : p
}

function isCatalogSection(pathname: string): boolean {
  const parts = normalizePath(pathname).split("/").filter(Boolean)
  if (parts.length < 2) return false
  return parts[1] === "catalog"
}

function isCallbacksSection(pathname: string): boolean {
  const parts = normalizePath(pathname).split("/").filter(Boolean)
  if (parts.length < 2) return false
  return parts[1] === "callbacks"
}

function isReviewsSection(pathname: string): boolean {
  const parts = normalizePath(pathname).split("/").filter(Boolean)
  if (parts.length < 2) return false
  return parts[1] === "reviews"
}

function isBlogSection(pathname: string): boolean {
  const parts = normalizePath(pathname).split("/").filter(Boolean)
  if (parts.length < 2) return false
  return parts[1] === "blog"
}

function isSettingsSection(pathname: string): boolean {
  const parts = normalizePath(pathname).split("/").filter(Boolean)
  if (parts.length < 2) return false
  return parts[1] === "settings"
}

function isCalculatorSection(pathname: string): boolean {
  const parts = normalizePath(pathname).split("/").filter(Boolean)
  if (parts.length < 2) return false
  return parts[1] === "profit-calculator"
}

function isFinanceSection(pathname: string): boolean {
  const parts = normalizePath(pathname).split("/").filter(Boolean)
  if (parts.length < 2) return false
  return parts[1] === "finance-control"
}

function buildHref(base: string, segment: string): string {
  if (!segment) return base
  return segment.includes("/") ? `${base}/${segment}` : `${base}/${segment}`
}

function NavLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={cn(
        "shrink-0 rounded-full border border-black/10 bg-white px-3 py-1 transition-colors inline-flex items-center gap-1.5",
        active ? "border-black text-foreground" : "hover:border-black hover:text-foreground"
      )}
    >
      {label}
    </a>
  )
}

function SubNav({ base, pathname, items }: { base: string; pathname: string; items: NavItem[] }) {
  const p = normalizePath(pathname)
  return (
    <nav className="flex items-center gap-2 overflow-x-auto text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      {items.map((item) => {
        const href = item.segment ? buildHref(base, item.segment) : base
        const h = normalizePath(href)
        const active = item.segment === "" ? p === h : p === h || p.startsWith(`${h}/`)
        return <NavLink key={item.key} href={href} active={active} label={item.label} />
      })}
    </nav>
  )
}

export function AdminNav() {
  const pathname = usePathname()
  const base = adminRootFromPathname(pathname)
  const catalogSection = isCatalogSection(pathname)
  const callbacksSection = isCallbacksSection(pathname)
  const reviewsSection = isReviewsSection(pathname)
  const blogSection = isBlogSection(pathname)
  const settingsSection = isSettingsSection(pathname)
  const calculatorSection = isCalculatorSection(pathname)
  const financeSection = isFinanceSection(pathname)
  const normalizedPath = normalizePath(pathname)

  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch("/api/admin/callbacks?status=PENDING")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.callbacks)) setPendingCount(d.callbacks.length)
      })
      .catch(() => {})
  }, [])

  const subNavItems = catalogSection ? catalog : reviewsSection ? reviewsSub : settingsSection || calculatorSection || financeSection ? [] : blogSection ? [] : orders

  return (
    <>
      <div className="space-y-2">
        <nav className="flex items-center gap-2 overflow-x-auto text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {sections.map((item) => {
            const href = item.segment ? buildHref(base, item.segment) : base
            let active = false
            if (item.key === "catalog") {
              active = catalogSection
            } else if (item.key === "callbacks") {
              active = callbacksSection
            } else if (item.key === "blog") {
              active = blogSection
            } else if (item.key === "reviews") {
              active = reviewsSection
            } else if (item.key === "settings") {
              active = settingsSection
            } else if (item.key === "calculator") {
              active = calculatorSection
            } else if (item.key === "finance") {
              active = financeSection
            } else {
              active =
                  !catalogSection &&
                  !callbacksSection &&
                  !blogSection &&
                  !reviewsSection &&
                  !settingsSection &&
                  !calculatorSection &&
                  !financeSection &&
                  (normalizedPath === base || normalizedPath.startsWith(`${base}/`))
            }
            return (
              <NavLink
                key={item.key}
                href={href}
                active={active}
                label={
                  item.key === "callbacks" && pendingCount > 0
                    ? `Заявки (${pendingCount})`
                    : item.label
                }
              />
            )
          })}
        </nav>
        <SubNav base={base} pathname={pathname} items={subNavItems} />
      </div>
    </>
  )
}
