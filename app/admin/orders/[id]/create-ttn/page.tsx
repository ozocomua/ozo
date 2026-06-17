"use client"

import { useState, useEffect, useCallback, useMemo, use } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { adminRootFromPathname } from "../../../admin-nav"
import { Search, Loader2 } from "lucide-react"

type OrderData = {
  id: number
  orderNumber: string
  total: number
  user: { phone: string; name: string | null }
  cityName: string | null
  cityRef: string | null
  deliveryPoint: string | null
  deliveryType: string | null
  courierHouse: string | null
  courierApartment: string | null
  comment: string | null
  ttn: string | null
}

type CityOption = { name: string; ref: string }
type WarehouseOption = { name: string; ref: string }

export default function CreateTtnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const pathname = usePathname()
  const orderId = Number(id)

  const adminRoot = adminRootFromPathname(pathname)

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)

  // City search
  const [cityQuery, setCityQuery] = useState("")
  const [cities, setCities] = useState<CityOption[]>([])
  const [cityOpen, setCityOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null)
  const [cityLoading, setCityLoading] = useState(false)
  // Track whether we've auto-selected the city from order
  const [cityAutoFilled, setCityAutoFilled] = useState(false)

  // Warehouse search
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])
  const [warehouseQuery, setWarehouseQuery] = useState("")
  const [warehouseOpen, setWarehouseOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseOption | null>(null)
  const [warehouseLoading, setWarehouseLoading] = useState(false)
  const [warehouseAutoFilled, setWarehouseAutoFilled] = useState(false)

  const [weight, setWeight] = useState(1)
  const [seats, setSeats] = useState(1)
  const [description, setDescription] = useState("Товари")
  const [declaredValue, setDeclaredValue] = useState(0)
  const [backwardDelivery, setBackwardDelivery] = useState(true)
  const [redeliveryString, setRedeliveryString] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [ttnResult, setTtnResult] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Load order ──────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/admin/orders?status=ALL`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.orders as OrderData[])?.find((o) => o.id === orderId) ?? null
        setOrder(found)
        if (found) {
          setDeclaredValue(found.total)
          setRedeliveryString(String(found.total))
        }
      })
      .finally(() => setLoading(false))
  }, [orderId])

  // ── Auto-select city from order ─────────────────────────────
  useEffect(() => {
    if (!order || cityAutoFilled) return
    if (!order.cityRef || !order.cityName) return

    // Auto-fill: set city directly from order data
    const autoCity: CityOption = { name: order.cityName, ref: order.cityRef }
    setSelectedCity(autoCity)
    setCityQuery(order.cityName)
    setCityAutoFilled(true)

    // Immediately fetch warehouses for this city
    setWarehouseLoading(true)
    fetch(`/api/admin/novaposhta/warehouses?cityRef=${encodeURIComponent(order.cityRef)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? (data as WarehouseOption[]) : []
        setWarehouses(list)

        // ── Auto-select warehouse from order ──────────────────
        if (!warehouseAutoFilled && order.deliveryPoint) {
          const clientPoint = order.deliveryPoint.toLowerCase().trim()
          const match = list.find((w) =>
            w.name.toLowerCase().includes(clientPoint) ||
            clientPoint.includes(w.name.toLowerCase())
          )
          if (match) {
            setSelectedWarehouse(match)
            setWarehouseQuery(match.name)
            setWarehouseAutoFilled(true)
          }
        }
      })
      .finally(() => setWarehouseLoading(false))
  }, [order, cityAutoFilled, warehouseAutoFilled])

  // ── City search (debounced) ─────────────────────────────────
  const searchCities = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCities([])
      return
    }
    setCityLoading(true)
    try {
      const res = await fetch(`/api/admin/novaposhta/cities?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      setCities(Array.isArray(data) ? (data as CityOption[]) : [])
    } finally {
      setCityLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!cityQuery || cityAutoFilled) return
    const t = setTimeout(() => searchCities(cityQuery), 300)
    return () => clearTimeout(t)
  }, [cityQuery, searchCities, cityAutoFilled])

  // ── Select city ─────────────────────────────────────────────
  const selectCity = (c: CityOption) => {
    setSelectedCity(c)
    setCityQuery(c.name)
    setCityOpen(false)
    setCities([])
    setSelectedWarehouse(null)
    setWarehouseQuery("")
    setWarehouses([])
    setWarehouseAutoFilled(false)

    setWarehouseLoading(true)
    fetch(`/api/admin/novaposhta/warehouses?cityRef=${encodeURIComponent(c.ref)}`)
      .then((r) => r.json())
      .then((data) => setWarehouses(Array.isArray(data) ? (data as WarehouseOption[]) : []))
      .finally(() => setWarehouseLoading(false))
  }

  // ── Client-side warehouse filter ────────────────────────────
  const filteredWarehouses = useMemo(() => {
    if (!warehouseQuery.trim()) return warehouses.slice(0, 30)
    const q = warehouseQuery.toLowerCase().trim()
    return warehouses
      .filter((w) => w.name.toLowerCase().includes(q))
      .slice(0, 50)
  }, [warehouses, warehouseQuery])

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedCity || !selectedWarehouse || !order) return
    setSubmitting(true)
    setErrorMsg(null)
    setTtnResult(null)

    try {
      const res = await fetch("/api/admin/novaposhta/create-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          recipientCityRef: selectedCity.ref,
          recipientAddressRef: selectedWarehouse.ref,
          recipientName: order.user.name || "Клієнт",
          recipientPhone: order.user.phone,
          weight,
          seatsAmount: seats,
          description,
          cost: declaredValue,
          backwardDeliveryRedeliveryString:
            backwardDelivery && redeliveryString ? redeliveryString : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? "Не вдалося створити ТТН")
        return
      }

      setTtnResult(data.ttn)
      setTimeout(() => router.push(adminRoot), 2000)
    } catch {
      setErrorMsg("Помилка мережі")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">Завантаження замовлення...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground text-sm">Замовлення не знайдено</p>
        <Link href={adminRoot} className="text-blue-600 text-sm underline">
          Назад до замовлень
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href={adminRoot}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Назад до замовлень
        </Link>
        <h1 className="text-2xl font-serif font-bold text-foreground mt-2">
          Створення ТТН — Замовлення №{order.orderNumber}
        </h1>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-6">
        {/* ── Дані отримувача ──────────────────────────────── */}
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Дані отримувача
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">ПІБ:</span>{" "}
              <span className="font-medium">{order.user.name || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Телефон:</span>{" "}
              <span className="font-medium">{order.user.phone}</span>
            </div>
            {order.cityName && (
              <div>
                <span className="text-muted-foreground">Місто клієнта:</span>{" "}
                <span className="font-medium text-green-700">{order.cityName}</span>
              </div>
            )}
            {order.deliveryPoint && (
              <div>
                <span className="text-muted-foreground">Відділення клієнта:</span>{" "}
                <span className="font-medium text-green-700">{order.deliveryPoint}</span>
              </div>
            )}
            {order.deliveryType === "courier" && order.courierHouse && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Адреса кур'єра:</span>{" "}
                <span className="font-medium">
                  {[
                    order.courierHouse ? `Буд. ${order.courierHouse}` : "",
                    order.courierApartment ? `Кв. ${order.courierApartment}` : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Адреса доставки НП ───────────────────────────── */}
        <div className="border-t pt-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Адреса доставки НП
          </h2>

          {/* Auto-fill badge */}
          {cityAutoFilled && selectedCity && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700 mb-4">
              ✅ Місто та відділення підставлено автоматично із замовлення. За потреби — змініть.
            </div>
          )}

          <div className="space-y-4">
            {/* City search */}
            <div className="relative">
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Місто
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value)
                    setCityOpen(true)
                    setCityAutoFilled(false)
                    setSelectedCity(null)
                    setWarehouses([])
                    setSelectedWarehouse(null)
                    setWarehouseQuery("")
                    setWarehouseAutoFilled(false)
                  }}
                  onFocus={() => setCityOpen(true)}
                  placeholder="Введіть місто..."
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                />
                {cityLoading && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-300" />
                )}
              </div>
              {cityOpen && cities.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {cities.map((c) => (
                    <button
                      key={c.ref}
                      type="button"
                      onClick={() => selectCity(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Warehouse search (replaces <select>) */}
            <div className="relative">
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Відділення
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  value={warehouseQuery}
                  onChange={(e) => {
                    setWarehouseQuery(e.target.value)
                    setWarehouseOpen(true)
                    setWarehouseAutoFilled(false)
                    setSelectedWarehouse(null)
                  }}
                  onFocus={() => setWarehouseOpen(true)}
                  onBlur={() => setTimeout(() => setWarehouseOpen(false), 200)}
                  disabled={!selectedCity}
                  placeholder={
                    !selectedCity
                      ? "Спочатку оберіть місто"
                      : warehouseLoading
                      ? "Завантаження відділень..."
                      : "Почніть вводити номер або назву відділення..."
                  }
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                />
                {warehouseLoading && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-300" />
                )}
                {selectedWarehouse && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-bold">
                    ✓
                  </span>
                )}
              </div>
              {warehouseOpen && filteredWarehouses.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {filteredWarehouses.map((w) => (
                    <button
                      key={w.ref}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedWarehouse(w)
                        setWarehouseQuery(w.name)
                        setWarehouseOpen(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
              {warehouseOpen && !warehouseLoading && filteredWarehouses.length === 0 && selectedCity && warehouseQuery.trim() && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-4 text-center">
                  <p className="text-xs text-slate-400">Нічого не знайдено за «{warehouseQuery}»</p>
                </div>
              )}
              {/* Show first 10 when no query */}
              {warehouseOpen && !warehouseQuery.trim() && warehouses.length > 0 && !warehouseLoading && filteredWarehouses.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {filteredWarehouses.map((w) => (
                    <button
                      key={w.ref}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSelectedWarehouse(w)
                        setWarehouseQuery(w.name)
                        setWarehouseOpen(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Параметри вантажу ────────────────────────────── */}
        <div className="border-t pt-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Параметри вантажу
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Вага (кг)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 1)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Кількість місць
              </label>
              <input
                type="number"
                min="1"
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Опис вантажу
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Заявлена вартість (₴)
              </label>
              <input
                type="number"
                min="0"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase">
                Зворотня доставка (Післяплата)
              </label>
              <button
                type="button"
                onClick={() => {
                  setBackwardDelivery(!backwardDelivery)
                  if (backwardDelivery) setRedeliveryString("")
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  backwardDelivery ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    backwardDelivery ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {backwardDelivery && (
              <div className="mt-3">
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Сума післяплати (грн)
                </label>
                <input
                  type="number"
                  min="1"
                  value={redeliveryString}
                  onChange={(e) => setRedeliveryString(e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Сума, яку отримувач повинен сплатити при отриманні. Післяплата повертається на ваш рахунок.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Сума замовлення: <span className="font-bold text-foreground">{order.total} ₴</span>
          </div>
          {errorMsg && (
            <p className="text-red-500 text-xs font-bold">{errorMsg}</p>
          )}
          {ttnResult ? (
            <div className="text-center space-y-1">
              <p className="text-green-600 font-bold text-lg">🎉 ТТН створена!</p>
              <p className="text-2xl font-black font-mono text-foreground">{ttnResult}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedCity || !selectedWarehouse}
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-500 transition-colors text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Створення..." : "Створити ТТН"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
