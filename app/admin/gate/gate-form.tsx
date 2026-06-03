"use client"

import { useState } from "react"

type Props = {
  nextPath: string
  showConfigWarning: boolean
  secretConfigured: boolean
}

export function AdminGateForm({ nextPath, showConfigWarning, secretConfigured }: Props) {
  const [secret, setSecret] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, next: nextPath }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; next?: string }
      if (!res.ok) {
        setError(data.error || (res.status === 401 ? "Невірний ключ" : "Помилка входу"))
        return
      }
      window.location.href = data.next || nextPath
    } catch {
      setError("Мережева помилка")
    } finally {
      setLoading(false)
    }
  }

  if (showConfigWarning) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl italic text-foreground mb-3">Адмін недоступний</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          У production на сервері не задано змінну середовища{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">ADMIN_ACCESS_SECRET</code>.
          Додайте її в налаштуваннях хостингу (Vercel / сервер) і перезапустіть застосунок.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm max-w-md w-full">
      <h1 className="font-serif text-2xl italic text-foreground mb-1">Вхід в адмінку</h1>
      <p className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-6">
        Секретний ключ з серверного env
      </p>
      {!secretConfigured && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
          Локально задайте <code className="font-mono">ADMIN_ACCESS_SECRET</code> у файлі{" "}
          <code className="font-mono">.env</code>.
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-secret" className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">
            Ключ доступу
          </label>
          <input
            id="admin-secret"
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-[#F9F9F7] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
            placeholder="Вставте значення ADMIN_ACCESS_SECRET"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-black py-3 text-[11px] font-black uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Перевірка…" : "Увійти"}
        </button>
      </form>
    </div>
  )
}
