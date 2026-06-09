"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { adminRootFromPathname } from "../../../admin-nav"

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

  const [cityQuery, setCityQuery] = useState("")
  const [cities, setCities] = useState<CityOption[]>([])
  const [cityOpen, setCityOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null)
  const [cityLoading, setCityLoading] = useState(false)

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseOption | null>(null)
  const [warehouseLoading, setWarehouseLoading] = useState(false)

  const [weight, setWeight] = useState(1)
  const [seats, setSeats] = useState(1)
  const [description, setDescription] = useState("Товари - опис відправлення")
  const [declaredValue, setDeclaredValue] = useState(0)
  const [backwardDelivery, setBackwardDelivery] = useState(false)
  const [redeliveryString, setRedeliveryString] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [ttnResult, setTtnResult] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/orders?status=ALL`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.orders as OrderData[])?.find((o) => o.id === orderId) ?? null
        setOrder(found)
        if (found) {
          setDeclaredValue(found.total)
          if (found.cityName) setCityQuery(found.cityName)
        }
      })
      .finally(() => setLoading(false))
  }, [orderId])

  const searchCities = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCities([])
      return
    }
    setCityLoading(true)
    try {
      const res = await fetch(`/api/admin/novaposhta/cities?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      setCities(Array.isArray(data) ? data : [])
    } finally {
      setCityLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!cityQuery) {
      setCities([])
      return
    }
    const t = setTimeout(() => searchCities(cityQuery), 300)
    return () => clearTimeout(t)
  }, [cityQuery, searchCities])

  const selectCity = (c: CityOption) => {
    setSelectedCity(c)
    setCityQuery(c.name)
    setCityOpen(false)
    setCities([])
    setSelectedWarehouse(null)
    setWarehouses([])

    setWarehouseLoading(true)
    fetch(`/api/admin/novaposhta/warehouses?cityRef=${encodeURIComponent(c.ref)}`)
      .then((r) => r.json())
      .then((data) => setWarehouses(Array.isArray(data) ? data : []))
      .finally(() => setWarehouseLoading(false))
  }

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
        <p className="text-muted-foreground text-sm">Загрузка заказа...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground text-sm">Заказ не найден</p>
        <Link href={adminRoot} className="text-blue-600 text-sm underline">
          Назад к заказам
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
          ← Назад к заказам
        </Link>
        <h1 className="text-2xl font-serif font-bold text-foreground mt-2">
          Создание ТТН — Заказ №{order.orderNumber}
        </h1>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Данные получателя
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">ФИО:</span>{" "}
              <span className="font-medium">{order.user.name || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Телефон:</span>{" "}
              <span className="font-medium">{order.user.phone}</span>
            </div>
            {order.cityName && (
              <div>
                <span className="text-muted-foreground">Город клиента:</span>{" "}
                <span className="font-medium">{order.cityName}</span>
              </div>
            )}
            {order.deliveryPoint && (
              <div>
                <span className="text-muted-foreground">Отделение клиента:</span>{" "}
                <span className="font-medium">{order.deliveryPoint}</span>
              </div>
            )}
            {order.deliveryType === "courier" && order.courierHouse && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Адрес курьера:</span>{" "}
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

        <div className="border-t pt-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Адрес доставки НП
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Город
              </label>
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => {
                  setCityQuery(e.target.value)
                  setCityOpen(true)
                  setSelectedCity(null)
                  setWarehouses([])
                  setSelectedWarehouse(null)
                }}
                onFocus={() => cities.length > 0 && setCityOpen(true)}
                placeholder="Введите город..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
              />
              {cityLoading && (
                <div className="absolute right-3 top-9 text-[10px] text-slate-400">Поиск...</div>
              )}
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

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Отделение
              </label>
              {warehouseLoading ? (
                <p className="text-[10px] text-slate-400 py-2">Загрузка отделений...</p>
              ) : (
                <select
                  value={selectedWarehouse?.ref ?? ""}
                  onChange={(e) => {
                    const found = warehouses.find((w) => w.ref === e.target.value)
                    setSelectedWarehouse(found ?? null)
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">
                    {selectedCity ? "Выберите отделение" : "Сначала выберите город"}
                  </option>
                  {warehouses.map((w) => (
                    <option key={w.ref} value={w.ref}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Параметры груза
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                Вес (кг)
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
                Количество мест
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
                Описание груза
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
                Заявленная стоимость (₴)
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
            Сумма заказа: <span className="font-bold text-foreground">{order.total} ₴</span>
          </div>
          {errorMsg && (
            <p className="text-red-500 text-xs font-bold">{errorMsg}</p>
          )}
          {ttnResult ? (
            <div className="text-center space-y-1">
              <p className="text-green-600 font-bold text-lg">🎉 ТТН создана!</p>
              <p className="text-2xl font-black font-mono text-foreground">{ttnResult}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedCity || !selectedWarehouse}
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-500 transition-colors text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Создание..." : "Создать ТТН"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
