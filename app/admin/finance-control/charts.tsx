"use client"

import { useEffect, useState, useCallback } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type AnalyticsData = {
  profitByDay: { date: string; total: number }[]
  categories: { name: string; total: number }[]
  totalRevenue: number
  orderCount: number
  month: number
  year: number
  dateFrom: string
  dateTo: string
}

const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
]

const COLORS = ["#0B53A4", "#00B5D1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"]

const safeDateKey = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00")
  return `${d.getDate()}.${d.getMonth() + 1}`
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function FinanceCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── Date state ── */
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [useCustom, setUseCustom] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = "/api/admin/analytics"
      if (useCustom && customFrom && customTo) {
        url += `?from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`
      } else {
        const from = fmtDate(new Date(viewYear, viewMonth, 1))
        const to = fmtDate(new Date(viewYear, viewMonth + 1, 0))
        url += `?from=${from}&to=${to}`
      }
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Помилка завантаження")
      }
      const json = await res.json()
      setData(json as AnalyticsData)
    } catch (err: any) {
      setError(err?.message || "Помилка")
    } finally {
      setLoading(false)
    }
  }, [viewMonth, viewYear, customFrom, customTo, useCustom])

  useEffect(() => { load() }, [load])

  const prevMonth = () => {
    if (useCustom) return
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }

  const nextMonth = () => {
    if (useCustom) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const goCurrentMonth = () => {
    setUseCustom(false)
    setViewMonth(now.getMonth())
    setViewYear(now.getFullYear())
  }

  const toggleCustom = () => {
    if (!useCustom) {
      const d = data
      setCustomFrom(d?.dateFrom || fmtDate(new Date(viewYear, viewMonth, 1)))
      setCustomTo(d?.dateTo || fmtDate(new Date(viewYear, viewMonth + 1, 0)))
    }
    setUseCustom(!useCustom)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center text-sm text-muted-foreground">
        {error || "Немає даних для відображення"}
      </div>
    )
  }

  const rangeLabel = useCustom
    ? `${safeDateKey(customFrom)} – ${safeDateKey(customTo)}`
    : `${MONTHS[viewMonth]} ${viewYear}`

  return (
    <div className="space-y-5">
      {/* ---- Controls ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {!useCustom ? (
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold min-w-[140px] text-center">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronRight size={18} />
            </button>
            {(viewMonth !== now.getMonth() || viewYear !== now.getFullYear()) && (
              <Button variant="outline" size="sm" onClick={goCurrentMonth}>
                Поточний
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-xs"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-xs"
            />
            <Button variant="outline" size="sm" onClick={load} disabled={!customFrom || !customTo}>
              Оновити
            </Button>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={toggleCustom} className="text-[11px] text-muted-foreground">
          {useCustom ? "Місяць" : "Свій діапазон"}
        </Button>
      </div>

      {/* ---- Summary cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Виторг</p>
          <p className="text-xl font-bold text-foreground mt-1">{data.totalRevenue.toLocaleString("uk-UA")} ₴</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{rangeLabel}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Замовлень</p>
          <p className="text-xl font-bold text-foreground mt-1">{data.orderCount}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{rangeLabel}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Середній чек</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {data.orderCount > 0 ? Math.round(data.totalRevenue / data.orderCount).toLocaleString("uk-UA") : 0} ₴
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{rangeLabel}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Категорій</p>
          <p className="text-xl font-bold text-foreground mt-1">{data.categories.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">в продажах</p>
        </div>
      </div>

      {/* ---- Charts row ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="font-serif text-lg font-medium mb-1">Виторг за днями</h3>
          <p className="text-[11px] text-muted-foreground mb-4">{rangeLabel}</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.profitByDay} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={safeDateKey} tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                formatter={(value: number) => [`${value.toLocaleString("uk-UA")} ₴`, "Виторг"]}
                labelFormatter={(label: string) => safeDateKey(label)}
              />
              <Line type="monotone" dataKey="total" stroke="#00B5D1" strokeWidth={2.5} dot={{ fill: "#0B53A4", strokeWidth: 0, r: 4 }} activeDot={{ fill: "#0B53A4", strokeWidth: 2, stroke: "#fff", r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h3 className="font-serif text-lg font-medium mb-1">Продажі за категоріями</h3>
          <p className="text-[11px] text-muted-foreground mb-4">{rangeLabel}</p>
          {data.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.categories} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={50} paddingAngle={2} stroke="none">
                  {data.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }} formatter={(value: number) => [`${value.toLocaleString("uk-UA")} ₴`, "Виторг"]} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">Немає даних про категорії</div>
          )}
        </div>
      </div>
    </div>
  )
}
