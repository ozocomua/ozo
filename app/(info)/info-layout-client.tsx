"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Header from "@/components/header"

const MENU_ITEMS = [
  { name: "Про нас", href: "/about" },
  { name: "Оплата і доставка", href: "/delivery" },
  { name: "Обмін та повернення", href: "/returns" },
  { name: "Контактна інформація", href: "/contacts" },
  { name: "Відгуки про магазин", href: "/reviews" },
  { name: "Поширені запитання", href: "/faq" },
  { name: "Політика конфіденційності", href: "/privacy" },
]

type HeaderCategory = { slug: string; name: string }

export function InfoLayoutClient({
  children,
  headerCategories,
}: {
  children: React.ReactNode
  headerCategories: HeaderCategory[]
}) {
  const pathname = usePathname()

  return (
    <>
      <Header categories={headerCategories} />

      <div className="min-h-screen bg-background pt-10 pb-20 font-sans text-foreground">
        <div className="max-w-6xl mx-auto px-4">

          <Link
            href="/"
            className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest opacity-40 hover:opacity-100 transition-opacity mb-8 group w-fit"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            На головну
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-12 lg:gap-16">

            <aside className="hidden md:block space-y-5">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 mb-8 font-sans">
                Інформація
              </p>
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block text-[11px] uppercase tracking-[0.2em] font-bold transition-all font-sans ${
                    pathname === item.href
                      ? "text-[#00B5D1] border-l-2 border-[#00B5D1] pl-5 opacity-100"
                      : "text-foreground opacity-30 hover:opacity-100 pl-0"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </aside>

            <main className="bg-card rounded-[2.5rem] px-12 sm:px-14 md:px-16 py-8 md:py-16 shadow-sm border border-border min-h-[500px] overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
