import { Truck, CreditCard, ShieldCheck } from "lucide-react"

export default function DeliveryBanner() {
  const features = [
    {
      icon: Truck,
      title: "Нова / Укр пошта",
      desc: "Доставка по всій Україні",
    },
    {
      icon: CreditCard,
      title: "Оплата при отриманні",
      desc: "Накладений платіж",
    },
    {
      icon: ShieldCheck,
      title: "Гарантія якості",
      desc: "Якість для фермерів",
    },
  ]

  return (
    <section className="bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white">
      <div className="max-w-5xl mx-auto px-4 py-2.5 md:py-3.5">

        <div className="grid grid-cols-2 gap-4 md:hidden">
          {features.slice(0, 2).map((f) => (
            <div key={f.title} className="flex items-center gap-2.5">
              <f.icon size={18} className="shrink-0 opacity-80" />
              <div>
                <p className="text-xs font-semibold">{f.title}</p>
                <p className="text-[11px] sm:text-xs opacity-60 leading-tight md:text-sm md:opacity-70">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:grid md:grid-cols-3 md:divide-x md:divide-white/20">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-start md:items-center text-left md:text-center flex-1 px-6 first:pl-0 last:pr-0">
              <div className="flex items-center md:justify-center gap-2 mb-1">
                <f.icon size={18} className="shrink-0 opacity-80" />
                <p className="text-sm font-medium">{f.title}</p>
              </div>
              <p className="text-xs opacity-70">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="w-full mt-4 md:mt-5 pt-3 border-t border-white/15 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 md:gap-4 px-3">

            <a
              href="tel:+380778687777"
              className="text-sm sm:text-base md:text-lg font-bold hover:opacity-80 transition-opacity inline-block"
            >
              +38 (077) 868 77-77
            </a>

            <span className="hidden sm:inline opacity-30">|</span>

            <span className="text-xs sm:text-sm md:text-base opacity-70 font-light">
              Графік роботи: Пн-Нд 09:00 - 21:00
            </span>

          </div>
        </div>

      </div>
    </section>
  )
}
