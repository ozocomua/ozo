"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import CallbackWidget from "@/components/ui/callbackwidget"
import { CreditCard, ShieldCheck, MapPin, Package, Info, User, Phone, ArrowLeft } from "lucide-react"

interface OrderData {
  id: number
  orderNumber: string
  total: number
  delivery: string
  items: string
  paymentType: string
  paymentStatus: string
  paymentUrl: string | null
  userName: string
  phone: string
}

export default function PayPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/checkout/pay/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setData(json)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] font-serif opacity-20 animate-pulse uppercase tracking-[0.3em]">
        OZO...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] py-16 px-4 text-center">
        <p className="text-lg font-serif italic opacity-60">Замовлення не знайдено</p>
        <Link href="/" className="inline-block mt-8 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white px-6 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest">
          На головну
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-[#F9F9F7] py-10 md:py-20 px-4 md:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Повернутися до магазину
          </Link>

          {/* ГОЛОВНИЙ БЛОК ОПЛАТИ */}
          <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden border border-black/5 p-6 md:p-10 text-center space-y-8">
            <div className="inline-flex p-6 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white rounded-full">
              <CreditCard size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-serif italic">Оплата замовлення</h1>
              <p className="text-[11px] sm:text-xs uppercase font-bold opacity-40 tracking-widest">
                Замовлення #{data.id} очікує на оплату
              </p>
            </div>

            <div className="space-y-4">
              <a 
                href={data.paymentUrl || "#"} 
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-6 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-widest hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-95 transition-all shadow-xl shadow-[#00B5D1]/20"
              >
                Сплатити {data.total} ₴
              </a>
            </div>

            <div className="bg-black/5 rounded-2xl p-6 flex items-start gap-4 text-left border border-black/5">
              <div className="bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white p-2 rounded-lg shrink-0">
                <Info size={16} />
              </div>
              <p className="text-[11px] sm:text-xs font-bold uppercase leading-relaxed tracking-tight">
                Після успішної оплати в додатку банку ваше замовлення буде автоматично 
                підтверджено та передано на склад для підготовки до відправки.
              </p>
            </div>
          </div>

          {/* РОЗШИРЕНІ ДЕТАЛІ ЗАМОВЛЕННЯ */}
          <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden border border-black/5 p-6 md:p-10 space-y-6 md:space-y-10">
            <div className="flex justify-between items-end border-b border-black/5 pb-8">
              <div>
                <p className="text-[11px] sm:text-xs uppercase font-bold opacity-40 mb-1">Разом до сплати</p>
                <p className="text-3xl md:text-4xl font-black">{data.total} ₴</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase font-bold opacity-40 mb-2">
                  <ShieldCheck size={12} className="text-green-600" /> MyIBAN Secure Payment
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 opacity-40 text-[11px] sm:text-xs uppercase font-bold">
                  <User size={14} /> Отримувач
                </div>
                <p className="text-sm font-bold uppercase">{data.userName}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 opacity-40 text-[11px] sm:text-xs uppercase font-bold">
                  <MapPin size={14} /> Адреса доставки
                </div>
                <p className="text-sm font-medium leading-relaxed">{data.delivery}</p>
              </div>

              <div className="space-y-4 md:col-span-2 pt-4 border-t border-black/5">
                <div className="flex items-center gap-3 opacity-40 text-[11px] sm:text-xs uppercase font-bold">
                  <Package size={14} /> Склад замовлення
                </div>
                <p className="text-sm opacity-80 leading-relaxed italic font-serif">{data.items}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
