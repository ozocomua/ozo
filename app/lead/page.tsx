"use client"

import Link from "next/link"
import { useEffect } from "react"
import CallbackWidget from "@/components/ui/callbackwidget"

export default function LeadPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead")
    }
  }, [])

  return (
    <>
      <div className="min-h-screen bg-[#F9F9F7] py-8 md:py-20 px-4 md:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-sm overflow-hidden border border-black/5 text-center">
          {/* Статус-бар */}
          <div className="bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white p-10 md:p-14">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 opacity-60 text-[11px] uppercase font-bold tracking-[0.2em]">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Замовлення прийнято
              </div>
              <h1 className="text-2xl md:text-4xl font-serif italic leading-tight">
                Дякуємо за замовлення!
              </h1>
            </div>
          </div>

          <div className="p-10 md:p-14 space-y-6">
            <p className="text-base md:text-lg opacity-60 leading-relaxed font-serif italic">
              Наш оператор зв'яжеться з вами найближчим часом для уточнення деталей.
            </p>

            <div className="h-px bg-black/5 w-full" />

            <div className="space-y-4">
              <p className="text-xs uppercase font-bold tracking-widest opacity-30">
                Що далі?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                {[
                  { num: "01", text: "Менеджер зв'яжеться з вами" },
                  { num: "02", text: "Узгодимо всі деталі замовлення" },
                  { num: "03", text: "Відправимо Новою Поштою" },
                ].map((step) => (
                  <div key={step.num} className="bg-muted/40 rounded-2xl p-4">
                    <span className="text-2xl font-black opacity-10">{step.num}</span>
                    <p className="text-[11px] font-bold uppercase tracking-tight mt-1 opacity-60">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:from-[#0c5db8] hover:to-[#00c5e3] active:scale-95 transition-all mt-4"
            >
              На головну
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
