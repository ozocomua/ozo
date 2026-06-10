import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Про нас | OZO",
  description: "OZO — ваш надійний постачальник обладнання для птахівництва по всій Україні.",
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-serif font-bold">Про нас</h1>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          OZO — це українська компанія, яка спеціалізується на виробництві та постачанні
          якісного обладнання для птахівництва. Ми допомагаємо фермерам та птахівникам
          по всій Україні.
        </p>
        <p>
          Наша місія — забезпечити доступ до надійного, довговічного обладнання за
          чесними цінами. Кожен товар проходить контроль якості перед відправкою.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="font-bold text-foreground text-2xl">1000+</p>
            <p className="text-sm">задоволених клієнтів</p>
          </div>
          <div>
            <p className="font-bold text-foreground text-2xl">24/7</p>
            <p className="text-sm">прийом замовлень</p>
          </div>
          <div>
            <p className="font-bold text-foreground text-2xl">1–3 дні</p>
            <p className="text-sm">доставка по Україні</p>
          </div>
        </div>
      </div>
    </div>
  )
}
