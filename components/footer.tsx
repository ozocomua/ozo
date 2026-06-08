"use client"

import Link from "next/link"
import { Phone, MessageSquare } from "lucide-react"

export default function Footer() {
  const openCallback = () => {
    window.dispatchEvent(new Event('open-callback'));
  };

  return (
    <footer className="border-t border-border bg-card mt-4">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex flex-col leading-none">
              <span className="font-serif text-xl font-bold tracking-tight text-foreground">
                OZO
              </span>
              <span className="text-[10px] font-sans tracking-[0.2em] text-muted-foreground uppercase">
                Store
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Все для птахівництва та фермерських господарств
            </p>
          </div>

          {/* Контакти */}
          <div className="space-y-4">
            <p className="text-xs tracking-widest text-muted-foreground uppercase font-bold">
              Контакти
            </p>
            <div className="space-y-3">
              <a href="tel:+380778687777" className="block text-sm font-bold hover:opacity-60 transition-opacity">
                +38 (077) 868 77-77
              </a>
              <div className="flex flex-col gap-2">
                <a 
                  href="viber://chat?number=%2B380778687777" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#7360f2]/10 text-[#7360f2] rounded-xl text-[11px] font-bold uppercase tracking-tight hover:bg-[#7360f2] hover:text-white transition-all w-fit"
                >
                  <MessageSquare size={14} /> Viber
                </a>
                <a 
                  href="tel:+380778687777" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 text-black rounded-xl text-[11px] font-bold uppercase tracking-tight hover:bg-black hover:text-white transition-all w-fit"
                >
                  <Phone size={14} /> Зателефонувати
                </a>
              </div>
            </div>
          </div>

          {/* Інфо — Тепер тут всі посилання */}
          <div className="space-y-4">
            <p className="text-xs tracking-widest text-muted-foreground uppercase font-bold">
              Інформація
            </p>
            <div className="flex flex-col gap-2 text-sm text-foreground/80">
              <Link href="/blog" className="hover:opacity-60 transition-opacity">Блог</Link>
              <Link href="/delivery" className="hover:opacity-60 transition-opacity">Оплата та доставка</Link>
              <Link href="/returns" className="hover:opacity-60 transition-opacity">Обмін та повернення</Link>
              <Link href="/reviews" className="hover:opacity-60 transition-opacity">Відгуки</Link>
              <Link href="/contacts" className="hover:opacity-60 transition-opacity">Контакти</Link>
            </div>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <p className="text-xs tracking-widest text-muted-foreground uppercase font-bold">
              Ми в мережах
            </p>
            <div className="flex flex-col gap-2 text-sm text-foreground/80">
              <a href="https://t.me/broscodesign" target="_blank" rel="noopener noreferrer nofollow" className="hover:opacity-60 transition-opacity">Telegram</a>
              <a href="https://tiktok.com/@brosco.design" target="_blank" rel="noopener noreferrer nofollow" className="hover:opacity-60 transition-opacity">TikTok</a>
              <a href="https://instagram.com/brosco.design" target="_blank" rel="noopener noreferrer nofollow" className="hover:opacity-60 transition-opacity">Instagram</a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              © 2025 OZO.
            </p>
            <button 
              onClick={openCallback}
              className="text-[10px] uppercase tracking-widest font-black border-b border-black pb-0.5 hover:opacity-50 transition-opacity"
            >
              Зворотній зв'язок
            </button>
          </div>
          <Link href="/" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors font-bold">
            На головну
          </Link>
        </div>
      </div>
    </footer>
  )
}