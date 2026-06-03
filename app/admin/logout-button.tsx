"use client"

import { useState } from "react"

export function AdminLogoutButton() {
  const [busy, setBusy] = useState(false)

  async function logout() {
    setBusy(true)
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      const path = window.location.pathname
      window.location.href = path.startsWith("/admin") ? "/admin/gate" : path
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-muted-foreground hover:border-black hover:text-foreground disabled:opacity-40 transition-colors"
    >
      {busy ? "…" : "Вийти"}
    </button>
  )
}
