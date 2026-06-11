"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { AdminNav } from "./admin-nav"
import { AdminLogoutButton } from "./logout-button"

export function AdminHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const financeRef = useRef<{ sales: any[]; settings: any } | null>(null)

  useEffect(() => {
    fetch("/api/admin/finance")
      .then(r => r.json())
      .then(d => {
        financeRef.current = d
        if (d.settings?.usdRate) setUsdRate(d.settings.usdRate)
      })
      .catch(() => {})
  }, [])

  const startEdit = () => {
    if (usdRate === null) return
    setDraft(usdRate.toString())
    setEditing(true)
  }

  const saveRate = async () => {
    const val = parseFloat(draft)
    if (!isFinite(val) || val <= 0 || !financeRef.current) return
    setSaving(true)
    try {
      const nextSettings = { ...financeRef.current.settings, usdRate: val }
      await fetch("/api/admin/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales: financeRef.current.sales || [], settings: nextSettings }),
      })
      setUsdRate(val)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const fetchNBU = async () => {
    try {
      const res = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json")
      const data = await res.json()
      if (data[0]?.rate) {
        const rate = parseFloat(data[0].rate.toFixed(2))
        setDraft(rate.toString())
        if (!editing) {
          if (!financeRef.current) return
          setSaving(true)
          const nextSettings = { ...financeRef.current.settings, usdRate: rate }
          await fetch("/api/admin/finance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sales: financeRef.current.sales || [], settings: nextSettings }),
          })
          setUsdRate(rate)
          setSaving(false)
        }
      }
    } catch {
      // silent
    }
  }

  return (
    <header className="relative border-b border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
        {/* Top row: logo | USD rate | desktop nav + burger */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-serif text-lg italic">Адмін</span>

            {editing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.1"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveRate()}
                  className="w-16 text-[10px] font-bold border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-400 text-center"
                  autoFocus
                />
                <button
                  onClick={saveRate}
                  disabled={saving}
                  className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold hover:bg-blue-500 transition disabled:opacity-50"
                >
                  {saving ? "..." : "Оновити"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-[9px] text-muted-foreground hover:text-foreground px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {usdRate !== null ? (
                  <button
                    onClick={startEdit}
                    className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100 transition cursor-pointer"
                    title="Натисніть щоб змінити курс"
                  >
                    $ {usdRate.toFixed(2)}
                  </button>
                ) : (
                  <span className="text-[10px] text-muted-foreground">...</span>
                )}
                <button
                  onClick={fetchNBU}
                  className="text-[9px] text-muted-foreground hover:text-blue-600 transition px-1"
                  title="Оновити з НБУ"
                >
                  НБУ
                </button>
              </div>
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
