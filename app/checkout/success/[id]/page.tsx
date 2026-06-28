"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import CallbackWidget from "@/components/ui/callbackwidget"
import Link from "next/link"

interface OrderData {
  id: number
  orderNumber: string
  total: number
  delivery: string
  items: string
  paymentType: string
  paymentStatus: string
  noCall: boolean
  userName: string
  phone: string
}

export default function SuccessPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/checkout/success/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error)
        } else {
          setData(json)
          // Fire Purchase event on Meta Pixel
          if (typeof window !== "undefined" && (window as any).fbq) {
            (window as any).fbq("track", "Purchase", {
              value: json.total,
              currency: "UAH",
              order_id: json.id,
            })
          }
        }
      })
      .catch(() => setError("Помилка завантаження"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] font-serif opacity-20 animate-pulse uppercase tracking-[0.3em]">
        OZO...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] py-16 px-4 text-center">
        <p className="text-lg font-serif italic opacity-60">{error || "Замовлення не знайдено"}</p>
        <Link href="/" className="inline-block mt-8 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white px-6 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest">
          На головну
        </Link>
      </div>
    )
  }

  const successMessage = data.noCall
    ? "Дякуємо за замовлення! Ми вже прийняли його в роботу та надішлемо вам ТТН у SMS / Viber, як тільки відправимо посилку."
    : "Дякуємо! Наш оператор зв'яжеться з вами найближчим часом."

  const itemsList = (data.items ?? "")
    .split(", ")
    .filter((line: string) => line.trim().length > 0)

  return (
    <>
      <div className="min-h-screen bg-[#F9F9F7] py-8 md:py-16 px-4 md:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-black/5">
          {/* Статус-бар */}
          <div className="bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white p-8 md:p-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 opacity-50 text-[10px] uppercase font-bold tracking-[0.2em]">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Замовлення прийнято
              </div>
              <h1 className="text-xl md:text-2xl font-serif italic leading-tight">
                {successMessage}
              </h1>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-6">
            {/* Номер та сума */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 sm:gap-0">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Номер</span>
                <span className="text-3xl md:text-4xl font-black tracking-tighter">#{data.id}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">До сплати</span>
                <span className="text-3xl md:text-4xl font-black tracking-tighter">{data.total} ₴</span>
              </div>
            </div>

            <div className="h-px bg-black/10 w-full" />

            {/* Склад замовлення та оплата */}
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Склад замовлення</span>
                <div className="space-y-1">
                  {itemsList.map((item: string, index: number) => (
                    <p key={index} className="text-lg md:text-xl font-serif italic opacity-90 leading-tight">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:text-right">
                <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Спосіб оплати</span>
                <p className="text-lg font-bold uppercase">
                  {data.paymentType === "cod" ? "Післяплата" : "Оплата карткою"}
                </p>
              </div>
            </div>

            <div className="h-px bg-black/10 w-full" />

            {/* Отримувач та доставка */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Отримувач</span>
                <p className="text-base md:text-lg font-bold uppercase tracking-tight leading-none">{data.userName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Адреса доставки</span>
                <p className="text-sm md:text-base font-medium leading-relaxed opacity-80">{data.delivery}</p>
              </div>
            </div>

            {/* Кнопка повернення */}
            <div className="pt-4">
              <Link
                href="/"
                className="block w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] text-center hover:from-[#0c5db8] hover:to-[#00c5e3] transition-all active:scale-[0.98]"
              >
                На головну
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 opacity-20">
          <p className="font-serif text-[9px] font-bold uppercase tracking-[0.4em]">OZO</p>
        </div>
      </div>
      <CallbackWidget />
    </>
  )
}
