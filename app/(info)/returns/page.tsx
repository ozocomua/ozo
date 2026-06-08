import type { Metadata } from "next"
import { Shield, RefreshCw, CreditCard, Truck, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Обмін та повернення товару | OZO",
  description:
    "Інформація про умови обміну та повернення товарів для птахівництва в інтернет-магазині OZO.",
}

export default function ReturnsPage() {
  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif italic">Обмін та повернення товару</h1>
        <p className="text-[10px] uppercase font-bold opacity-30 tracking-[0.3em]">OZO / Політика сервісу</p>
      </header>

      <div className="space-y-12 text-sm md:text-base leading-relaxed opacity-80">
        <section className="space-y-4">
          <p>
            Ми прагнемо, щоб ви були впевнені у якості обладнання, яке обираєте в інтернет-магазині{" "}
            <span className="text-foreground font-bold">OZO</span>. Умови повернення та обміну повністю відповідають
            Закону України «Про захист прав споживачів».
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-foreground" />
            <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Умови для обміну та повернення</h2>
          </div>
          <p className="text-foreground font-medium">
            Товар належної якості підлягає поверненню або обміну лише за умови збереження його товарного вигляду та споживчих властивостей:
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="text-foreground font-bold shrink-0 mt-0.5">—</span>
              <span>
                <strong>Товарний вигляд:</strong> Повернення можливе виключно за умови, що товар не має слідів
                використання, механічних пошкоджень, подряпин чи сколів.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-foreground font-bold shrink-0 mt-0.5">—</span>
              <span>
                <strong>Цілісність упаковки:</strong> Збережено оригінальну упаковку, заводські ярлики, захисні
                плівки та повну комплектацію товару.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-foreground font-bold shrink-0 mt-0.5">—</span>
              <span>
                <strong>Терміни:</strong> Ви можете звернутися щодо повернення чи обміну протягом{" "}
                <span className="text-foreground font-bold">14 днів</span> з моменту отримання замовлення.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-foreground font-bold shrink-0 mt-0.5">—</span>
              <span>
                <strong>Документи:</strong> Наявний документ, що підтверджує покупку (чек, експрес-накладна або номер
                замовлення).
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={18} className="text-foreground" />
            <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Процедура повернення коштів</h2>
          </div>
          <p>
            Повернення коштів здійснюється на вашу банківську картку (або розрахунковий рахунок) після отримання
            посилки та перевірки стану товару нашими спеціалістами. Термін зарахування грошей становить від{" "}
            <span className="text-foreground font-bold">1 до 3 робочих днів</span>.
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Truck size={18} className="text-foreground" />
            <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Хто оплачує доставку?</h2>
          </div>
          <div className="space-y-4">
            <div className="p-5 bg-secondary rounded-2xl border border-border">
              <p className="text-xs font-bold uppercase tracking-tight text-foreground mb-1">
                Товар належної якості
              </p>
              <p className="text-sm">
                Якщо товар вам не підійшов за розміром, характеристиками або ви просто передумали — послуги доставки
                перевізником (Нова Пошта / Укрпошта) оплачує{" "}
                <span className="text-foreground font-bold">покупець</span>.
              </p>
            </div>
            <div className="p-5 bg-primary text-primary-foreground rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-tight opacity-60 mb-1">Брак або помилка магазину</p>
              <p className="text-sm">
                Якщо ви виявили виробничий брак, пошкодження при транспортуванні або помилку з нашого боку (надіслали
                не той товар) — всі витрати на доставку в обидва боки повністю оплачує магазин{" "}
                <span className="font-bold">OZO</span>.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw size={18} className="text-foreground" />
            <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Як оформити повернення?</h2>
          </div>
          <div className="space-y-6">
            {[
              {
                n: "01",
                t: "Зв'яжіться з нами за телефоном або у зручному для вас месенджері (Viber / Telegram).",
              },
              {
                n: "02",
                t: "Менеджер надасть вам актуальні реквізити для відправки посилки Новою Поштою або Укрпоштою.",
              },
              {
                n: "03",
                t: "Надішліть товар без післяплати (накладеного платежу). Ми не можемо забрати посилку з післяплатою, оскільки повернення коштів перераховується на вашу картку суворо після огляду та перевірки товару.",
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-6">
                <span className="font-serif italic text-2xl opacity-20">{step.n}</span>
                <p className="pt-1">{step.t}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-6 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <Phone size={18} className="text-foreground" />
            <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Контакти для повернення</h2>
          </div>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Телефон:</strong>{" "}
              <a href="tel:+380778687777" className="hover:underline">
                +38 (077) 868 77-77
              </a>
            </li>
            <li>
              <strong>Viber:</strong>{" "}
              <a href="viber://chat?number=%2B380778687777" className="hover:underline">
                +38 (077) 868 77-77
              </a>
            </li>
            <li>
              <strong>Telegram:</strong>{" "}
              <a href="https://t.me/ozo_owner" target="_blank" rel="noopener noreferrer nofollow" className="hover:underline text-[#0088cc]">
                t.me/ozo_owner
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
