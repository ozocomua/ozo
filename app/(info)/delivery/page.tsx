export default function DeliveryPage() {
  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif italic">Доставка та оплата</h1>
        <p className="text-[10px] uppercase font-bold opacity-30 tracking-[0.3em]">OZO / Логістика</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 opacity-80">
        <section className="space-y-4">
          <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Доставка</h2>
          <div className="space-y-4">
            <p className="font-bold text-foreground">Нова Пошта</p>
            <p className="text-sm">Відправляємо щодня по всій Україні. Вартість згідно з тарифами перевізника.</p>
            <ul className="text-xs space-y-2 list-none font-bold opacity-60">
              <li>— Відділення</li>
              <li>— Поштомат</li>
              <li>— Адресна доставка</li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="font-bold text-foreground">Укрпошта</p>
            <p className="text-sm">Доставка до будь-якого населеного пункту України за тарифами перевізника.</p>
            <ul className="text-xs space-y-2 list-none font-bold opacity-60">
              <li>— Відділення</li>
              <li>— Експрес або Стандарт</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Оплата</h2>
          <div className="space-y-6 text-sm">
            <div>
              <p className="font-bold text-foreground mb-1 text-base">Онлайн на сайті</p>
              <p>Миттєва оплата карткою через захищений шлюз.</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-1 text-base">При отриманні</p>
              <p>Оплата у відділенні перевізника після огляду товару.</p>
            </div>
          </div>
        </section>
      </div>

        <div className="mt-8 pt-6 border-t">
          <h2 className="text-xl font-bold mb-4">Терміни та графік</h2>
          <div className="space-y-3 text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">📦</span>
              <div>
                <p className="font-medium text-foreground">Відправка замовлень</p>
                <p>Замовлення, оформлені до 15:00, відправляються в той самий день. Після 15:00 — наступного дня.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🚚</span>
              <div>
                <p className="font-medium text-foreground">Терміни доставки</p>
                <p>Нова Пошта: 1–3 дні по Україні. Укрпошта: 3–7 днів.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🕐</span>
              <div>
                <p className="font-medium text-foreground">Графік роботи</p>
                <p>Пн–Нд, 09:00–21:00. Замовлення приймаємо цілодобово через сайт.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">💰</span>
              <div>
                <p className="font-medium text-foreground">Вартість доставки</p>
                <p>За тарифами перевізника. Орієнтовно: від 70 грн (Нова Пошта, відділення). Точну вартість розраховує перевізник при оформленні.</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}