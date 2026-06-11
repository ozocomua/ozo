import type { Metadata } from "next"
import { HelpCircle, Truck, CreditCard, RotateCcw, Shield, PackageOpen, MapPin, Wrench } from "lucide-react"

export const metadata: Metadata = {
  title: "Поширені запитання | OZO",
  description:
    "Відповіді на найпоширеніші запитання про замовлення, доставку, оплату та обладнання OZO.",
}

export default function FaqPage() {
  const faqs = [
    {
      icon: HelpCircle,
      q: "Як оформити замовлення?",
      a: "Виберіть потрібний товар на сайті, додайте його в кошик та заповніть контактні дані. Після цього натисніть «Оформити замовлення». Наш менеджер зв’яжеться з вами для підтвердження.",
    },
    {
      icon: CreditCard,
      q: "Які способи оплати?",
      a: "Ми приймаємо оплату на карту (Monobank, ПриватБанк), а також післяплату при отриманні на Новій Пошті.",
    },
    {
      icon: Truck,
      q: "Скільки часу займає доставка?",
      a: "Зазвичай доставка по Україні займає 1–3 робочі дні після відправлення. Відправлення здійснюються щодня.",
    },
    {
      icon: RotateCcw,
      q: "Чи можна повернути товар?",
      a: "Так, ви можете повернути товар протягом 14 днів з моменту отримання, якщо він не був у використанні та збережено товарний вигляд. Детальніше — на сторінці «Обмін та повернення».",
    },
    {
      icon: Shield,
      q: "Чи є гарантія на обладнання?",
      a: "На все обладнання OZO надається гарантія 12 місяців. У разі виробничого дефекту ми замінимо товар або повернемо кошти.",
    },
    {
      icon: PackageOpen,
      q: "Як дізнатися статус замовлення?",
      a: "Після відправлення ви отримаєте номер ТТН Нової Пошти в Telegram або Viber. Ви можете відстежувати посилку на сайті Нової Пошти.",
    },
    {
      icon: MapPin,
      q: "Де знаходиться ваше виробництво?",
      a: "Наше виробництво та склад знаходяться в смт. Врадіївка, Миколаївська область. Звідти ми відправляємо замовлення по всій Україні.",
    },
    {
      icon: Wrench,
      q: "Чи можна замовити індивідуальне виготовлення?",
      a: "Так, ми розглядаємо індивідуальні замовлення. Зв’яжіться з нами через Telegram або телефон для обговорення деталей.",
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-serif font-bold">Поширені запитання</h1>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="group bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#00B5D1]/40 transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B53A4]/10 to-[#00B5D1]/10 flex items-center justify-center group-hover:from-[#0B53A4]/20 group-hover:to-[#00B5D1]/20 transition-colors">
                <faq.icon size={18} className="text-[#0B53A4]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">{faq.q}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
