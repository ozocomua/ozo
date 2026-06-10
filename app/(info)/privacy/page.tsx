import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Політика конфіденційності | OZO",
  description:
    "Політика конфіденційності інтернет-магазину OZO. Дізнайтеся, як ми збираємо, обробляємо та захищаємо ваші персональні дані.",
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-serif font-bold">Політика конфіденційності</h1>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          Ми, компанія OZO, серйозно ставимося до захисту ваших персональних даних.
          Ця політика конфіденційності пояснює, яку інформацію ми збираємо, як її
          використовуємо та які заходи вживаємо для її захисту.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Які дані ми збираємо</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ім&apos;я та прізвище</li>
            <li>Номер телефону</li>
            <li>Адреса доставки (місто, відділення Нової Пошти)</li>
            <li>Історія замовлень</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Як ми використовуємо дані</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Обробка та доставка ваших замовлень</li>
            <li>Зв&apos;язок з вами щодо статусу замовлення</li>
            <li>Покращення якості обслуговування</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Захист даних</h2>
          <p>
            Ми використовуємо сучасні технології шифрування для захисту ваших даних.
            Доступ до персональної інформації мають лише уповноважені співробітники.
            Ми не передаємо ваші дані третім особам, окрім випадків, передбачених
            законодавством України.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Ваші права</h2>
          <p>
            Відповідно до Закону України «Про захист персональних даних», ви маєте
            право на доступ, виправлення, видалення ваших даних, а також на
            обмеження їх обробки. Для цього зв&apos;яжіться з нами через контакти
            на сайті.
          </p>
        </section>
      </div>
    </div>
  )
}
