import type { Metadata } from "next"
import { Shield, RefreshCw, CreditCard, Truck, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Обмін та повернення товару | Brosco Design",
  description:
    "Інформація про умови обміну та повернення товарів, автохімії та автокосметики в інтернет-магазині Brosco Design.",
}

export default function ReturnsPage() {
  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif italic">Обмін та повернення товару</h1>
        <p className="text-[10px] uppercase font-bold opacity-30 tracking-[0.3em]">Brosco Design / Політика сервісу</p>
      </header>

      <div className="space-y-12 text-sm md:text-base leading-relaxed opacity-80">
        <section className="space-y-4">
          <p>
            Ми прагнемо, щоб ви були впевнені у якості преміальної автохімії, яку обираєте в інтернет-магазині{" "}
            <span className="text-foreground font-bold">Brosco</span>. Оскільки ми спеціалізуємося на відвантаженні
            товарів у спеціальну тару певного об&apos;єму (на розлив), умови повернення та обміну мають свою
            специфіку, що базується на Законі України «Про захист прав споживачів».
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-foreground" />
            <h2 className="text-xs uppercase font-black tracking-widest opacity-40">Умови для обміну та повернення</h2>
          </div>
          <p className="text-foreground font-medium">
            Товар належної якості підлягає поверненню або обміну лише за умови збереження його початкових властивостей:
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="text-foreground font-bold shrink-0 mt-0.5">—</span>
              <span>
                <strong>Цілісність та герметичність:</strong> Повернення можливе виключно за умови збереження повної
                герметичності тари та цілісності пломб (захисного кільця на кришці).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-foreground font-bold shrink-0 mt-0.5">—</span>
              <span>
                <strong>Стан товару:</strong> Засіб не повинен бути використаний. Якщо захисний елемент був відкритий,
                або засіб був відлитий/використаний — такий товар поверненню не підлягає.
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
                <strong>Документи:</strong> Наявний документ, що підтверджує покупку (чек, накладна або номер
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
            Повернення коштів здійснюється на вашу банківську картку (або розрахунковий рахунок) після отримання та
            ретельної перевірки цілісності пломб нашими спеціалістами. Термін зарахування грошей становить від{" "}
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
                Якщо вам не підійшов об&apos;єм, тип засобу або ви просто передумали — послуги доставки Новою Поштою
                оплачує <span className="text-foreground font-bold">покупець</span>.
              </p>
            </div>
            <div className="p-5 bg-foreground text-background rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-tight opacity-60 mb-1">Брак або помилка магазину</p>
              <p className="text-sm">
                Якщо ви виявили помилку з нашого боку (не той товар, не той об&apos;єм) або пошкодження тари під час
                транспортування з нашої вини — всі витрати на доставку в обидва боки оплачує магазин{" "}
                <span className="font-bold">Brosco</span>.
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
                t: "Зв'яжіться з нашою службою підтримки за телефоном або у месенджерах.",
              },
              {
                n: "02",
                t: "Менеджер надасть вам актуальні реквізити для відправки посилки Новою Поштою.",
              },
              {
                n: "03",
                t: "Надішліть товар без накладеного платежу (ми не можемо забрати посилки з накладеним платежем, оскільки повернення коштів здійснюється лише на картку після огляду товару).",
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
                +38 (068) 946-47-43
              </a>
            </li>
            <li>
              <strong>Viber:</strong>{" "}
              <a href="viber://chat?number=%2B380778687777" className="hover:underline">
                +38 (068) 946-47-43
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
