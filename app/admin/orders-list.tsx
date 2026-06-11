"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Download } from "lucide-react"
import type { OrderStatus } from "@/lib/order-status"
import { ORDER_STATUSES, normalizeOrderStatus } from "@/lib/order-status"
import type { PaymentStatus } from "@/lib/payment-status"
import { PAYMENT_STATUSES, normalizePaymentStatus } from "@/lib/payment-status"
import { adminRootFromPathname } from "./admin-nav"

type AdminOrder = {
  id: number
  orderNumber: string
  total: number
  status: string
  items: string
  delivery: string
  paymentType: string | null
  paymentStatus: string | null
  noCall: boolean | null
  deliveryType: string | null
  cityName: string | null
  cityRef: string | null
  deliveryPoint: string | null
  courierHouse: string | null
  courierApartment: string | null
  courierEntrance: string | null
  courierFloor: string | null
  comment: string | null
  ttn: string | null
  createdAt: string
  user: { phone: string; name: string | null }
  tags: Array<{ name: string }>
}

const statusLabelByValue = new Map<OrderStatus, string>(
  ORDER_STATUSES.map((s) => [s.value, s.label])
)

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString("ru-RU")
}

function formatMoney(value: number): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return String(value)
  return `${num.toFixed(2)} грн`
}

function paymentLabel(value: string | null): string {
  if (!value) return "—"
  if (value === "card") return "Карткою онлайн"
  if (value === "cod") return "Накладний"
  return value
}

function paymentStatusLabel(value: PaymentStatus): string {
  const found = PAYMENT_STATUSES.find((s) => s.value === value)
  return found ? found.label : value
}

function normalizeText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : ""
}

function buildDeliverySummary(o: AdminOrder): string {
  const delivery = normalizeText(o.delivery)
  const cityName = normalizeText(o.cityName)
  const deliveryPoint = normalizeText(o.deliveryPoint)

  if (cityName || deliveryPoint) {
    return [cityName, deliveryPoint].filter(Boolean).join(", ")
  }

  return delivery || "—"
}

function buildCourierDetails(o: AdminOrder): string {
  const house = normalizeText(o.courierHouse)
  const apartment = normalizeText(o.courierApartment)
  const entrance = normalizeText(o.courierEntrance)
  const floor = normalizeText(o.courierFloor)

  const parts = [
    house ? `Буд. ${house}` : "",
    apartment ? `Кв. ${apartment}` : "",
    entrance ? `Під'їзд ${entrance}` : "",
    floor ? `Поверх ${floor}` : "",
  ].filter(Boolean)

  return parts.join(", ")
}

function deliveryTypeLabel(value: string | null): string {
  if (!value) return ""
  if (value === "warehouse") return "Відділення"
  if (value === "postomat") return "Поштомат"
  if (value === "courier") return "Кур'єр"
  return value
}

function hasStructuredDelivery(o: AdminOrder): boolean {
  if (normalizeText(o.cityName)) return true
  if (normalizeText(o.deliveryPoint)) return true
  if (normalizeText(o.courierHouse)) return true
  if (normalizeText(o.courierApartment)) return true
  if (normalizeText(o.courierEntrance)) return true
  if (normalizeText(o.courierFloor)) return true
  return false
}

const PRESET_TAGS = ["Терміново", "Потрібно уточнити", "Проблема оплати", "Проблема доставки", "VIP"]

export function OrdersList({
  title,
  status,
}: {
  title: string
  status: "ALL" | OrderStatus
}) {
  const [q, setQ] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyById, setBusyById] = useState<Record<number, boolean>>({})
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [tagDraftById, setTagDraftById] = useState<Record<number, string>>({})

  const pathname = usePathname()
  const adminRoot = adminRootFromPathname(pathname)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("status", status)
    if (q.trim()) params.set("q", q.trim())
    if (tagFilter.trim()) params.set("tags", tagFilter.trim())
    return params.toString()
  }, [status, q, tagFilter])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders?${query}`, { cache: "no-store" })
      const data = (await res.json().catch(() => ({}))) as {
        orders?: AdminOrder[]
        error?: string
      }
      if (!res.ok) {
        setError(data.error ?? "Не вдалося завантажити замовлення.")
        setOrders([])
        return
      }
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [query])

  async function updateStatus(orderId: number, next: OrderStatus) {
    setBusyById((s) => ({ ...s, [orderId]: true }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "Не вдалося оновити статус.")
        return
      }
      setOrders((prev) => {
        if (status !== "ALL" && next !== status) {
          return prev.filter((o) => o.id !== orderId)
        }
        return prev.map((o) => (o.id === orderId ? { ...o, status: next } : o))
      })
    } finally {
      setBusyById((s) => ({ ...s, [orderId]: false }))
    }
  }

  async function updatePaymentStatus(orderId: number, next: PaymentStatus) {
    setBusyById((s) => ({ ...s, [orderId]: true }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: next }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "Не вдалося оновити оплату.")
        return
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: next } : o)))
    } finally {
      setBusyById((s) => ({ ...s, [orderId]: false }))
    }
  }

  async function addTag(orderId: number, name: string) {
    const tag = name.trim()
    if (!tag) return
    setBusyById((s) => ({ ...s, [orderId]: true }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addTag: tag }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "Не вдалося додати тег.")
        return
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId && !o.tags.some((t) => t.name === tag)
            ? { ...o, tags: [...o.tags, { name: tag }] }
            : o
        )
      )
      setTagDraftById((s) => ({ ...s, [orderId]: "" }))
    } finally {
      setBusyById((s) => ({ ...s, [orderId]: false }))
    }
  }

  async function removeTag(orderId: number, name: string) {
    const tag = name.trim()
    if (!tag) return
    setBusyById((s) => ({ ...s, [orderId]: true }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeTag: tag }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "Не вдалося видалити тег.")
        return
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, tags: o.tags.filter((t) => t.name !== tag) } : o
        )
      )
    } finally {
      setBusyById((s) => ({ ...s, [orderId]: false }))
    }
  }

  async function deleteOrder(orderId: number, orderNumber: string) {
    const ok = window.confirm(
      `Видалити замовлення #${orderNumber}? Цю дію не можна скасувати.`
    )
    if (!ok) return
    setBusyById((s) => ({ ...s, [orderId]: true }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? "Не вдалося видалити замовлення.")
        return
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } finally {
      setBusyById((s) => ({ ...s, [orderId]: false }))
    }
  }

  async function exportToExcel() {
    const XLSX = await import("xlsx")
    const rows = orders.map((o) => ({
      "№": o.orderNumber,
      "Дата": formatDate(o.createdAt),
      "Клієнт": o.user.name ?? "—",
      "Телефон": o.user.phone,
      "Дзвінок": o.noCall ? "Не дзвонить" : "Дзвонить",
      "Оплата": paymentLabel(o.paymentType),
      "Статус оплати": paymentStatusLabel(normalizePaymentStatus(o.paymentStatus) ?? "UNPAID"),
      "Сума (грн)": o.total,
      "Доставка": buildDeliverySummary(o),
      "Товари": (o.items ?? "").split(", ").join("\n"),
      "Статус": statusLabelByValue.get(normalizeOrderStatus(o.status) ?? "NEW") ?? o.status,
      "ТТН": o.ttn || "—",
      "Коментар": o.comment || "—",
      "Теги": o.tags?.map((t) => t.name).join(", ") || "—",
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Замовлення")
    XLSX.writeFile(wb, `zamovlennya-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Пошук по № замовлення або телефону. Статус можна змінювати в таблиці.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Пошук: № або телефон"
            className="sm:w-[280px]"
          />
          <Input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Тег (фільтр)"
            className="sm:w-[180px]"
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Оновити
          </Button>
          <Button variant="outline" onClick={() => void exportToExcel()} disabled={orders.length === 0}>
            <Download size={16} className="mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTagFilter(t)}
            className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-black hover:text-foreground transition-colors"
          >
            {t}
          </button>
        ))}
        {tagFilter ? (
          <button
            type="button"
            onClick={() => setTagFilter("")}
            className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-black hover:text-foreground transition-colors"
          >
            Скинути
          </button>
        ) : null}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border bg-white p-6 text-center text-muted-foreground">
            Завантаження…
          </div>
        ) : orders.length ? (
          orders.map((o) => {
            const normalized = normalizeOrderStatus(o.status) ?? "NEW"
            const pay = normalizePaymentStatus(o.paymentStatus) ?? "UNPAID"
            const label = statusLabelByValue.get(normalized) ?? o.status
            const needCall = !Boolean(o.noCall)
            const expanded = expandedId === o.id
            const tagDraft = tagDraftById[o.id] ?? ""
            const deliverySummary = buildDeliverySummary(o)
            const courierDetails = o.deliveryType === "courier" ? buildCourierDetails(o) : ""
            const shouldShowDeliveryType = hasStructuredDelivery(o)
            const deliveryTypeHuman = shouldShowDeliveryType ? deliveryTypeLabel(o.deliveryType) : ""
            const busy = Boolean(busyById[o.id])

            return (
              <div
                key={o.id}
                className="rounded-2xl border bg-white p-4 space-y-3"
                onClick={() => setExpandedId((v) => (v === o.id ? null : o.id))}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Замовлення №{o.orderNumber}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(o.createdAt)}
                    </div>
                  </div>
                  <Badge variant="secondary">{label}</Badge>
                </div>

                <div className="space-y-0.5">
                  <div className="text-sm font-medium">{o.user.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{o.user.phone}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={needCall ? "default" : "outline"}>
                    {needCall ? "Дзвонить" : "Не дзвонить"}
                  </Badge>
                  <Badge variant={pay === "PAID" ? "default" : "secondary"}>
                    {paymentStatusLabel(pay)}
                  </Badge>
                  <Badge variant="outline">{paymentLabel(o.paymentType)}</Badge>
                </div>

                {o.tags?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {o.tags.slice(0, 3).map((t) => (
                      <Badge key={t.name} variant="outline">
                        {t.name}
                      </Badge>
                    ))}
                    {o.tags.length > 3 ? (
                      <Badge variant="outline">+{o.tags.length - 3}</Badge>
                    ) : null}
                  </div>
                ) : null}

                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground">Доставка:</span>{" "}
                    <span className="font-medium">{deliverySummary}</span>
                  </div>
                  {deliveryTypeHuman ? (
                    <div>
                      <span className="text-muted-foreground">Тип:</span>{" "}
                      <span className="font-medium">{deliveryTypeHuman}</span>
                    </div>
                  ) : null}
                  {o.deliveryType === "courier" && courierDetails ? (
                    <div>
                      <span className="text-muted-foreground">Адреса:</span>{" "}
                      <span className="font-medium">{courierDetails}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-bold">{formatMoney(o.total)}</div>
                  <div className="text-xs text-muted-foreground">
                    {expanded ? "Сховати" : "Детальніше"}
                  </div>
                </div>

                {expanded ? (
                  <div
                    className="border-t pt-4 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Статус
                        </div>
                        <select
                          value={normalized}
                          onChange={(e) => void updateStatus(o.id, e.target.value as OrderStatus)}
                          disabled={busy}
                          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Оплата
                        </div>
                        <select
                          value={pay}
                          onChange={(e) =>
                            void updatePaymentStatus(o.id, e.target.value as PaymentStatus)
                          }
                          disabled={busy}
                          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        variant="destructive"
                        onClick={() => void deleteOrder(o.id, o.orderNumber)}
                        disabled={busy}
                      >
                        Видалити замовлення
                      </Button>

                      {o.ttn ? (
                        <div className="text-xs">
                          <span className="text-muted-foreground">ТТН:</span>{" "}
                          <span className="font-mono font-bold text-green-600">{o.ttn}</span>
                        </div>
                      ) : (
                        <a
                          href={`${adminRoot}/orders/${o.id}/create-ttn`}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-colors"
                        >
                          🚚 ТТН
                        </a>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Товари
                      </div>
                      <div className="rounded-xl border bg-[#F9F9F7] p-3 text-sm whitespace-pre-wrap">
                        {(o.items ?? "").split(", ").join("\n")}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Коментар
                      </div>
                      <div className="text-sm font-medium">
                        {o.comment || "—"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        Теги
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {o.tags?.length ? (
                          o.tags.map((t) => (
                            <button
                              key={t.name}
                              type="button"
                              onClick={() => void removeTag(o.id, t.name)}
                              disabled={busy}
                              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-black hover:text-foreground transition-colors disabled:opacity-40"
                            >
                              {t.name} <span className="text-[12px]">×</span>
                            </button>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Немає тегів</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Input
                          value={tagDraft}
                          onChange={(e) =>
                            setTagDraftById((s) => ({ ...s, [o.id]: e.target.value }))
                          }
                          placeholder="Додати тег (Enter)"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                void addTag(o.id, tagDraft)
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            onClick={() => void addTag(o.id, tagDraft)}
                            disabled={busy}
                          >
                            Додати
                          </Button>
                          <div className="flex flex-wrap gap-2">
                            {PRESET_TAGS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => void addTag(o.id, t)}
                              disabled={busy}
                              className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-black hover:text-foreground transition-colors disabled:opacity-40"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })
        ) : (
          <div className="rounded-2xl border bg-white p-6 text-center text-muted-foreground">
            Немає замовлень.
          </div>
        )}
      </div>

      <div className="hidden md:block rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>№</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Клієнт</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Дзвінок</TableHead>
              <TableHead>Оплата</TableHead>
              <TableHead>Сума</TableHead>
              <TableHead>Теги</TableHead>
              <TableHead className="min-w-[220px]">Доставка</TableHead>
              <TableHead className="min-w-[260px]">Товари</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>ТТН</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="py-10 text-center text-muted-foreground">
                  Завантаження…
                </TableCell>
              </TableRow>
            ) : orders.length ? (
              orders.flatMap((o) => {
                const normalized = normalizeOrderStatus(o.status) ?? "NEW"
                const pay = normalizePaymentStatus(o.paymentStatus) ?? "UNPAID"
                const label = statusLabelByValue.get(normalized) ?? o.status
                const needCall = !Boolean(o.noCall)
                const expanded = expandedId === o.id
                const tagDraft = tagDraftById[o.id] ?? ""
                const deliverySummary = buildDeliverySummary(o)
                const courierDetails =
                  o.deliveryType === "courier" ? buildCourierDetails(o) : ""
                const shouldShowDeliveryType = hasStructuredDelivery(o)
                const deliveryTypeHuman = shouldShowDeliveryType
                  ? deliveryTypeLabel(o.deliveryType)
                  : ""

                return [
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId((v) => (v === o.id ? null : o.id))}
                  >
                    <TableCell className="font-medium">{o.orderNumber}</TableCell>
                    <TableCell>{formatDate(o.createdAt)}</TableCell>
                    <TableCell className="whitespace-normal">{o.user.name ?? "—"}</TableCell>
                    <TableCell>{o.user.phone}</TableCell>
                    <TableCell>
                      <Badge variant={needCall ? "default" : "outline"}>
                        {needCall ? "Дзвонить" : "Не дзвонить"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={pay === "PAID" ? "default" : "secondary"}>
                          {paymentStatusLabel(pay)}
                        </Badge>
                        <Badge variant="outline">{paymentLabel(o.paymentType)}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatMoney(o.total)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {o.tags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {o.tags.slice(0, 2).map((t) => (
                            <Badge key={t.name} variant="outline">
                              {t.name}
                            </Badge>
                          ))}
                          {o.tags.length > 2 ? (
                            <Badge variant="outline">+{o.tags.length - 2}</Badge>
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal">{o.delivery}</TableCell>
                    <TableCell className="whitespace-normal">{o.items}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {o.ttn ? (
                        <span className="font-mono text-xs font-bold text-green-600">{o.ttn}</span>
                      ) : (
                        <a
                          href={`${adminRoot}/orders/${o.id}/create-ttn`}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-500 transition-colors"
                        >
                          🚚 ТТН
                        </a>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{label}</Badge>
                        <select
                          value={normalized}
                          onChange={(e) =>
                            void updateStatus(o.id, e.target.value as OrderStatus)
                          }
                          disabled={Boolean(busyById[o.id])}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <select
                          value={pay}
                          onChange={(e) =>
                            void updatePaymentStatus(o.id, e.target.value as PaymentStatus)
                          }
                          disabled={Boolean(busyById[o.id])}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          {PAYMENT_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteOrder(o.id, o.orderNumber)}
                          disabled={Boolean(busyById[o.id])}
                        >
                          Видалити
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>,
                  expanded ? (
                    <TableRow key={`${o.id}-details`}>
                      <TableCell colSpan={13} className="bg-[#F9F9F7]">
                        <div className="rounded-2xl border bg-white p-5 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Дані для відправки
                              </p>
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="text-muted-foreground">ПІБ:</span>{" "}
                                  <span className="font-medium">{o.user.name ?? "—"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Телефон:</span>{" "}
                                  <span className="font-medium">{o.user.phone}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Доставка:</span>{" "}
                                  <span className="font-medium">{deliverySummary}</span>
                                </div>
                                {deliveryTypeHuman ? (
                                  <div>
                                    <span className="text-muted-foreground">Тип доставки:</span>{" "}
                                    <span className="font-medium">{deliveryTypeHuman}</span>
                                  </div>
                                ) : null}
                                {o.deliveryType === "courier" && courierDetails ? (
                                  <div>
                                    <span className="text-muted-foreground">Адреса:</span>{" "}
                                <span className="font-medium">{courierDetails}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Кошик і коментар
                              </p>
                              <div className="text-sm space-y-2">
                                <div className="rounded-xl border bg-[#F9F9F7] p-3 whitespace-pre-wrap">
                                  {(o.items ?? "").split(", ").join("\n")}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Коментар:</span>{" "}
                                  <span className="font-medium">{o.comment || "—"}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Теги
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {o.tags?.length ? (
                                o.tags.map((t) => (
                                  <button
                                    key={t.name}
                                    type="button"
                                    onClick={() => void removeTag(o.id, t.name)}
                                    disabled={Boolean(busyById[o.id])}
                                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-black hover:text-foreground transition-colors disabled:opacity-40"
                                  >
                                    {t.name} <span className="text-[12px]">×</span>
                                  </button>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">Немає тегів</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <Input
                                value={tagDraft}
                                onChange={(e) =>
                                  setTagDraftById((s) => ({ ...s, [o.id]: e.target.value }))
                                }
                                placeholder="Додати тег (Enter)"
                                className="sm:w-[260px]"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    void addTag(o.id, tagDraft)
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                onClick={() => void addTag(o.id, tagDraft)}
                                disabled={Boolean(busyById[o.id])}
                              >
                                Додати
                              </Button>
                              <div className="flex flex-wrap gap-2">
                                {PRESET_TAGS.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => void addTag(o.id, t)}
                                    disabled={Boolean(busyById[o.id])}
                                    className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-black hover:text-foreground transition-colors disabled:opacity-40"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null,
                ].filter(Boolean)
              })
            ) : (
              <TableRow>
                <TableCell colSpan={13} className="py-10 text-center text-muted-foreground">
                  Немає замовлень.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
