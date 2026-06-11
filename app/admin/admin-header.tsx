"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { AdminNav } from "./admin-nav"
import { AdminLogoutButton } from "./logout-button"

export function AdminHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [usdRate, setUsdRate] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/admin/finance")
      .then(r => r.json())
      .then(d => { if (d.settings?.usdRate) setUsdRate(d.settings.usdRate) })
      .catch(() => {})
  }, [])

  return (
    <header className="relative border-b border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
        {/* Top row: logo | USD rate | desktop nav + burger */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg italic">Адмін</span>
            {usdRate !== null && (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                $ {usdRate.toFixed(2)}
              </span>
            )}
          </div>

          {/* Desktop right side — always visible */}
          <div className="hidden md:flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Сайт
            </Link>
            <AdminLogoutButton />
          </div>

          {/* Mobile burger button */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
            aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop nav — always visible */}
        <div className="hidden md:block">
          <AdminNav />
        </div>
      </div>

      {/* Mobile dropdown panel */}
      <div
        className={[
          "md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50 overflow-hidden transition-all duration-300 ease-in-out",
          menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 border-b-0 shadow-none",
        ].join(" ")}
      >
        <div className="px-4 py-4 space-y-4">
          <AdminNav />
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest pt-3 border-t border-black/5">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Сайт
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}
