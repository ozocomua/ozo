"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

function SuccessContent() {
  const searchParams = useSearchParams()
  
  const orderId = searchParams.get('id')
  const total = searchParams.get('total')
  const delivery = searchParams.get('delivery')
  const items = searchParams.get('items')
  const payment = searchParams.get('payment')
  const paymentUrl = searchParams.get('paymentUrl')
  const firstName = searchParams.get('firstName')
  const lastName = searchParams.get('lastName')
  const middleName = searchParams.get('middleName')
  const phone = searchParams.get('phone')
  const noCall = searchParams.get('noCall') === 'true'

  const successMessage = noCall
    ? 'Дякуємо за замовлення! Ми вже прийняли його в роботу та надішлемо вам ТТН у SMS / Viber, як тільки відправимо посилку.'
    : 'Дякуємо! Наш оператор зв\'яжеться з вами найближчим часом.'

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-8 md:py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-black/5">
        
        {/* Статус-бар (Чорний блок) */}
        <div className="bg-black text-white p-8 md:p-10">
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
          
          {/* 1. НОМЕР ТА СУМА */}
          <div className="flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Номер</span>
              <span className="text-3xl md:text-4xl font-black tracking-tighter">#{orderId}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">До сплати</span>
              <span className="text-3xl md:text-4xl font-black tracking-tighter">{total} ₴</span>
            </div>
          </div>

          <div className="h-px bg-black/10 w-full" /> {/* Полоска */}

          {/* 2. СКЛАД ЗАМОВЛЕННЯ ТА ОПЛАТА */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Склад замовлення</span>
              <div className="space-y-1">
                {(items ?? "")
                  .split(", ")
                  .filter((line) => line.trim().length > 0)
                  .map((item, index) => (
                    <p
                      key={index}
                      className="text-lg md:text-xl font-serif italic opacity-90 leading-tight"
                    >
                      {item}
                    </p>
                  ))}
              </div>
            </div>
            <div className="space-y-2 md:text-right">
              <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Спосіб оплати</span>
              <p className="text-lg font-bold uppercase">{payment || "Післяплата"}</p>
              {paymentUrl && (
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-1">
                  Оплатити <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          <div className="h-px bg-black/10 w-full" /> {/* Полоска */}

          {/* 3. ДАНІ ОТРИМУВАЧА ТА ДОСТАВКИ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Отримувач</span>
              <p className="text-base font-bold uppercase tracking-tight leading-none">{firstName} {middleName} {lastName}</p>
              <p className="text-sm font-medium opacity-60 leading-none">{phone}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] uppercase font-bold opacity-30 tracking-wider">Адреса доставки</span>
              <p className="text-sm font-medium leading-relaxed opacity-80">{delivery}</p>
            </div>
          </div>

          {/* КНОПКА ПОВЕРНЕННЯ */}
          <div className="pt-4">
            <Link 
              href="/" 
              className="block w-full bg-black text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] text-center hover:opacity-90 transition-all active:scale-[0.98]"
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
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] font-serif opacity-20 animate-pulse uppercase tracking-[0.3em]">OZO...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
