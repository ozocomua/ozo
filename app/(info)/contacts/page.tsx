import { MessageSquare, Phone, Instagram, Send, Youtube, Facebook } from "lucide-react"
import TikTokIcon from "@/components/icons/tiktok-icon" // Імпортуйте нову іконку

export default function ContactsPage() {
  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif italic text-foreground">Контакти</h1>
        <p className="text-[10px] uppercase font-bold opacity-30 tracking-[0.3em]">OZO / Зв'язок з нами</p>
      </header>

      <div className="space-y-12">
        {/* Телефони та Месенджери */}
        <section className="space-y-6">
          <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Телефон та месенджери</h2>
          <div className="flex flex-wrap gap-4">
            <a 
              href="tel:+380778687777" 
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white rounded-2xl hover:from-[#0c5db8] hover:to-[#00c5e3] transition-all w-full sm:w-auto"
            >
              <Phone size={18} />
              <span className="font-bold">+38 (077) 868 77-77</span>
            </a>
            <a 
              href="https://t.me/ozo_owner" 
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-3 px-6 py-4 bg-[#0088cc]/10 text-[#0088cc] rounded-2xl hover:bg-[#0088cc] hover:text-white transition-all w-full sm:w-auto"
            >
              <Send size={18} />
              <span className="font-bold">Telegram</span>
            </a>
            <a 
              href="viber://chat?number=%2B380778687777" 
              className="flex items-center gap-3 px-6 py-4 bg-[#7360f2]/10 text-[#7360f2] rounded-2xl hover:bg-[#7360f2] hover:text-white transition-all w-full sm:w-auto"
            >
              <MessageSquare size={18} />
              <span className="font-bold">Viber</span>
            </a>
          </div>
        </section>

        {/* Соціальні мережі */}
        <section className="space-y-6">
          <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Соціальні мережі</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href="https://t.me/ozo_com_ua" 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              className="group flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0088cc]/10 text-[#0088cc] rounded-xl group-hover:bg-[#0088cc] group-hover:text-white transition-colors">
                  <Send size={20} />
                </div>
                <span className="font-bold">Telegram</span>
              </div>
              <span className="text-[10px] opacity-30 group-hover:opacity-100 transition-opacity">@ozo_com_ua</span>
            </a>

            <a 
              href="https://www.instagram.com/ozo.com.ua" 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              className="group flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <Instagram size={20} />
                </div>
                <span className="font-bold">Instagram</span>
              </div>
              <span className="text-[10px] opacity-30 group-hover:opacity-100 transition-opacity">@ozo.com.ua</span>
            </a>

            {/* Оновлена кнопка TikTok з правильним значком */}
            <a 
              href="https://www.tiktok.com/@ozo.com.ua?_r=1&_t=ZM-91ouAZFUUdk" 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              className="group flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/10 text-black rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                  <TikTokIcon size={20} /> {/* Використовуйте TikTokIcon замість Video */}
                </div>
                <span className="font-bold">TikTok</span>
              </div>
              <span className="text-[10px] opacity-30 group-hover:opacity-100 transition-opacity">@ozo.com.ua</span>
            </a>

            <a 
              href="https://www.facebook.com/share/16szMEhHWR/?mibextid=wwXIfr" 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              className="group flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Facebook size={20} />
                </div>
                <span className="font-bold">Facebook</span>
              </div>
              <span className="text-[10px] opacity-30 group-hover:opacity-100 transition-opacity">@ozo.com.ua</span>
            </a>

            <a 
              href="https://www.youtube.com/@ozo_com_ua" 
              target="_blank" 
              rel="noopener noreferrer nofollow"
              className="group flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-primary transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-600/10 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Youtube size={20} />
                </div>
                <span className="font-bold">YouTube</span>
              </div>
              <span className="text-[10px] opacity-30 group-hover:opacity-100 transition-opacity">@ozo_com_ua</span>
            </a>
          </div>
        </section>

        {/* Графік роботи */}
        <section className="pt-8 border-t border-border">
          <div className="flex items-start gap-6 opacity-60">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest font-sans">Графік обробки замовлень</p>
              <p className="text-sm mt-2 italic">Щодня з 09:00 до 23:00</p>
              <p className="text-xs mt-2 italic">Відправки здійснюються з смт. Врадіївка</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}