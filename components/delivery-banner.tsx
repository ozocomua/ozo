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
      desc: "Все для птахівництва",
    },
  ]

  return (
    <section className="bg-foreground text-background">
      <div className="max-w-5xl mx-auto px-4 py-2.5 md:py-3.5">

        <div className="grid grid-cols-2 gap-4 md:hidden">
          {features.slice(0, 2).map((f) => (
            <div key={f.title} className="flex items-center gap-2.5">
              <f.icon size={18} className="shrink-0 text-background/70" />
              <div>
                <p className="text-xs font-semibold">{f.title}</p>
                <p className="text-[11px] text-background/50 leading-tight">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:grid md:grid-cols-3 md:divide-x md:divide-background/20">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-start md:items-center text-left md:text-center flex-1 px-6 first:pl-0 last:pr-0">
              <div className="flex items-center md:justify-center gap-2 mb-1">
                <f.icon size={18} className="shrink-0 text-background/70" />
                <p className="text-sm font-medium">{f.title}</p>
              </div>
              <p className="text-xs text-background/60">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="w-full mt-4 md:mt-5 pt-3 border-t border-background/10 text-center">
          <div className="flex items-center justify-center whitespace-nowrap text-[3.1vw] md:text-sm text-background tracking-normal md:tracking-[0.15em] gap-[1.5vw] md:gap-4 px-3">

            <a
              href="tel:+380778687777"
              className="font-medium hover:text-background/80 transition-colors inline-block"
            >
              +38 (077) 868 77-77
            </a>

            <span className="text-background/20">|</span>

            <span className="text-background/60 font-light">
              Графік роботи: Пн-Нд 09:00 - 21:00
            </span>

          </div>
        </div>

      </div>
    </section>
  )
}
