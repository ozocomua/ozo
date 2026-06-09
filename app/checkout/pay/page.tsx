"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { CreditCard, ShieldCheck, MapPin, Package, Info, User, Phone, ArrowLeft } from "lucide-react"

function PayContent() {
  const searchParams = useSearchParams()
  
  const orderId = searchParams.get('id')
  const total = searchParams.get('total')
  const delivery = searchParams.get('delivery')
  const items = searchParams.get('items')
  const paymentUrl = searchParams.get('paymentUrl')
  
  // Додаємо нові дані
  const firstName = searchParams.get('firstName')
  const lastName = searchParams.get('lastName')
  const middleName = searchParams.get('middleName')
  const phone = searchParams.get('phone')

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Повернутися до магазину
        </Link>

        {/* ГОЛОВНИЙ БЛОК ОПЛАТИ */}
        <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden border border-black/5 p-10 text-center space-y-8">
          <div className="inline-flex p-6 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white rounded-full">
            <CreditCard size={32} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-serif italic">Оплата замовлення</h1>
            <p className="text-[10px] uppercase font-bold opacity-40 tracking-widest">
              Замовлення #{orderId} очікує на оплату
            </p>
          </div>

          <div className="space-y-4">
            <a 
              href={paymentUrl || "#"} 
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-95 transition-all shadow-xl shadow-[#00B5D1]/20"
            >
              Сплатити {total} ₴
            </a>
          </div>

          <div className="bg-black/5 rounded-2xl p-6 flex items-start gap-4 text-left border border-black/5">
            <div className="bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white p-2 rounded-lg shrink-0">
              <Info size={16} />
            </div>
            <p className="text-[11px] font-bold uppercase leading-relaxed tracking-tight">
              Після успішної оплати в додатку банку ваше замовлення буде автоматично 
              підтверджено та передано на склад для підготовки до відправки.
            </p>
          </div>
        </div>

        {/* РОЗШИРЕНІ ДЕТАЛІ ЗАМОВЛЕННЯ */}
        <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden border border-black/5 p-10 space-y-10">
          <div className="flex justify-between items-end border-b border-black/5 pb-8">
            <div>
              <p className="text-[10px] uppercase font-bold opacity-40 mb-1">Разом до сплати</p>
              <p className="text-4xl font-black">{total} ₴</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-[9px] uppercase font-bold opacity-40 mb-2">
                <ShieldCheck size={12} className="text-green-600" /> MyIBAN Secure Payment
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Отримувач */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 opacity-40 text-[10px] uppercase font-bold">
                <User size={14} /> Отримувач
              </div>
              <p className="text-sm font-bold uppercase">{lastName} {firstName} {middleName}</p>
              <div className="flex items-center gap-3 opacity-40 text-[10px] uppercase font-bold pt-2">
                <Phone size={14} /> Контактний номер
              </div>
              <p className="text-sm font-mono">
                {phone?.startsWith("+") ? phone : phone ? `+${phone}` : "—"}
              </p>
            </div>

            {/* Доставка */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 opacity-40 text-[10px] uppercase font-bold">
                <MapPin size={14} /> Адреса доставки
              </div>
              <p className="text-sm font-medium leading-relaxed">{delivery}</p>
            </div>

            {/* Товари (на всю ширину) */}
            <div className="space-y-4 md:col-span-2 pt-4 border-t border-black/5">
              <div className="flex items-center gap-3 opacity-40 text-[10px] uppercase font-bold">
                <Package size={14} /> Склад замовлення
              </div>
              <p className="text-sm opacity-80 leading-relaxed italic font-serif">{items}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={null}>
      <PayContent />
    </Suspense>
  )
}
