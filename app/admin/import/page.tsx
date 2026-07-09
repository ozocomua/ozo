"use client"

import { useState } from "react"
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function ImportPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [stats, setStats] = useState<{
    categories?: { created: number; skipped: number }
    brands?: { created: number; skipped: number }
    products?: { created: number; updated: number; skipped: number }
  } | null>(null)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState("")

  async function startImport() {
    if (!url.trim()) return
    setLoading(true)
    setStatus("loading")
    setError("")
    setStats(null)
    setProgress("Завантаження JSON...")

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || "Помилка імпорту")
        setStatus("error")
        return
      }
      setStats(data.stats)
      setStatus("done")
    } catch (e: any) {
      setError(e.message || "Мережева помилка")
      setStatus("error")
    } finally {
      setLoading(false)
      setProgress("")
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Імпорт товарів</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Завантажте товари з JSON-експорту постачальника (Sandi B2B)
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          URL JSON-файлу
        </label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://b2b-sandi.com.ua/export/view/...json"
          className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-[#00B5D1] transition-all"
          disabled={loading}
        />

        <button
          onClick={startImport}
          disabled={loading || !url.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white font-bold py-4 rounded-xl hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {progress || "Імпорт..."}
            </>
          ) : (
            <>
              <Download size={18} />
              Почати імпорт
            </>
          )}
        </button>

        {/* Status */}
        {status === "loading" && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
            <Loader2 size={16} className="animate-spin shrink-0" />
            <span>Імпорт триває... Це може зайняти 2–5 хвилин для великих файлів.</span>
          </div>
        )}

        {status === "done" && stats && (
          <div className="space-y-3 p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle size={18} />
              Імпорт завершено!
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs text-emerald-700">
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="font-black text-lg">{(stats.categories?.created ?? 0) + (stats.categories?.skipped ?? 0)}</div>
                <div className="opacity-60">Категорій</div>
                <div className="text-[10px] mt-1">
                  +{stats.categories?.created ?? 0} нових / {stats.categories?.skipped ?? 0} існуючих
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="font-black text-lg">{(stats.brands?.created ?? 0) + (stats.brands?.skipped ?? 0)}</div>
                <div className="opacity-60">Брендів</div>
                <div className="text-[10px] mt-1">
                  +{stats.brands?.created ?? 0} нових / {stats.brands?.skipped ?? 0} існуючих
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="font-black text-lg">{(stats.products?.created ?? 0) + (stats.products?.updated ?? 0)}</div>
                <div className="opacity-60">Товарів</div>
                <div className="text-[10px] mt-1">
                  +{stats.products?.created ?? 0} нових / {stats.products?.updated ?? 0} оновлено
                </div>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-sm text-red-800">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
