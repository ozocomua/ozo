"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function ImportPage() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [total, setTotal] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jobIdRef = useRef("")

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  useEffect(() => { return stopPolling }, [stopPolling])

  async function startPolling(jid: string) {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/import?jobId=${jid}`)
        const data = await res.json()
        if (!res.ok) return
        setProgress(data.progress ?? 0)
        setProcessed(data.processed ?? 0)
        setTotal(data.total ?? 0)
        if (data.status === "done") {
          stopPolling()
          setStatus("done")
          setStats(data.stats)
          setLoading(false)
        } else if (data.status === "error") {
          stopPolling()
          setStatus("error")
          setError(data.error || "Помилка")
          setLoading(false)
        }
      } catch { /* ignore poll errors */ }
    }, 1500)
  }

  async function startImport() {
    if (!url.trim()) return
    setLoading(true)
    setStatus("running")
    setError("")
    setStats(null)
    setProgress(0)
    setProcessed(0)
    setTotal(0)

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Помилка запуску")
        setStatus("error")
        setLoading(false)
        return
      }
      jobIdRef.current = data.jobId
      startPolling(data.jobId)
    } catch (e: any) {
      setError(e.message || "Мережева помилка")
      setStatus("error")
      setLoading(false)
    }
  }

  const barProgress = total > 0 ? (processed / total) * 100 : progress

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
              Імпорт...
            </>
          ) : (
            <>
              <Download size={18} />
              Почати імпорт
            </>
          )}
        </button>

        {/* Progress bar */}
        {status === "running" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-bold">
              <span>{total > 0 ? `${processed} / ${total}` : "Підготовка..."}</span>
              <span>{Math.round(barProgress)}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(barProgress, 2)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Імпорт виконується у фоновому режимі. Можете закрити сторінку — процес триватиме.
            </p>
          </div>
        )}

        {/* Done */}
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
                <div className="text-[10px] mt-1">+{stats.categories?.created ?? 0} / {stats.categories?.skipped ?? 0}</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="font-black text-lg">{(stats.brands?.created ?? 0) + (stats.brands?.skipped ?? 0)}</div>
                <div className="opacity-60">Брендів</div>
                <div className="text-[10px] mt-1">+{stats.brands?.created ?? 0} / {stats.brands?.skipped ?? 0}</div>
              </div>
              <div className="bg-white/60 rounded-xl p-3 text-center">
                <div className="font-black text-lg">{(stats.products?.created ?? 0) + (stats.products?.updated ?? 0)}</div>
                <div className="opacity-60">Товарів</div>
                <div className="text-[10px] mt-1">+{stats.products?.created ?? 0} / ↻{stats.products?.updated ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
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
