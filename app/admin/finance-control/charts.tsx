"use client"

import { useEffect, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

type AnalyticsData = {
  profitByDay: { date: string; total: number }[]
  categories: { name: string; total: number }[]
  totalRevenue: number
  orderCount: number
  month: number
  year: number
}

const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
  "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень",
]

const COLORS = ["#0B53A4", "#00B5D1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"]

const formatDay = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.getDate().toString()
}

const safeDateKey = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

export default function FinanceCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/admin/analytics", { cache: "no-store" })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.error || "Помилка завантаження")
        }
        const json = await res.json()
        if (!cancelled) setData(json as AnalyticsData)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Помилка")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
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

  const monthLabel = `${MONTHS[data.month]} ${data.year}`

  return (
    <div className="space-y-6">
      {/* ---- Summary cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Виторг
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {data.totalRevenue.toLocaleString("uk-UA")} ₴
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{monthLabel}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Замовлень
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {data.orderCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{monthLabel}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Середній чек
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {data.orderCount > 0
              ? Math.round(data.totalRevenue / data.orderCount).toLocaleString("uk-UA")
              : 0} ₴
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{monthLabel}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Категорій
          </p>
          <p className="text-xl font-bold text-foreground mt-1">
            {data.categories.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">в продажах</p>
        </div>
      </div>

      {/* ---- Charts row ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit line chart */}
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="font-serif text-lg font-medium mb-1">
            Виторг за днями
          </h3>
          <p className="text-[11px] text-muted-foreground mb-4">{monthLabel}</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.profitByDay} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={safeDateKey}
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#888" }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 13,
                }}
                formatter={(value: number) => [`${value.toLocaleString("uk-UA")} ₴`, "Виторг"]}
                labelFormatter={(label: string) => safeDateKey(label)}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#00B5D1"
                strokeWidth={2.5}
                dot={{ fill: "#0B53A4", strokeWidth: 0, r: 4 }}
                activeDot={{ fill: "#0B53A4", strokeWidth: 2, stroke: "#fff", r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie chart */}
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="font-serif text-lg font-medium mb-1">
            Продажі за категоріями
          </h3>
          <p className="text-[11px] text-muted-foreground mb-4">{monthLabel}</p>
          {data.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.categories}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.categories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [`${value.toLocaleString("uk-UA")} ₴`, "Виторг"]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
              Немає даних про категорії
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
