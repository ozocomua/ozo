export default function DeliveryPage() {
  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif italic">Доставка та оплата</h1>
        <p className="text-[10px] uppercase font-bold opacity-30 tracking-[0.3em]">Brosco Design / Логістика</p>
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
              <p>Оплата у відділенні Нової Пошти після огляду товару.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}