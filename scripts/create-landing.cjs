#!/usr/bin/env node
/**
 * Створює лендінг для товару «Килимок OZO Преміум» (A000007).
 * Запускати в ~/ozo:  node scripts/create-landing.cjs
 * Якщо slug вже існує — оновиться.
 */
const fs = require("fs")
const path = require("path")

function loadEnv() {
  const file = path.join(__dirname, "..", ".env")
  const text = fs.readFileSync(file, "utf8")
  const env = {}
  for (const raw of text.split("\n")) {
    const m = raw.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let val = m[2]
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[m[1]] = val
  }
  return env
}

process.env.DATABASE_URL = loadEnv().DATABASE_URL

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const IMG = "/api/image/1780952780364-486495961-2026-06-09_00.02.13.webp"

const landing = {
  slug: "kilimok-ozo-premium",
  title: "Збережіть 99% молодняку з перших днів життя!",
  subtitle: "Безпечне, рівномірне та економне інфрачервоне тепло. Пташенята не мерзнуть, не тиснуться та ростуть у 1.5 рази швидше.",
  productName: "Килимок OZO Преміум (80 × 50 см)",
  productDesc:
    "Нагрівальний інфрачервоний килимок OZO Преміум — флагманське рішення для професійного обігріву брудерів, розсадних стелажів та вольєрів. Розмір 80 × 50 см.\n\nЧому обирають OZO Преміум:\n• Економічність — лише 110 Вт на 1 метр, регулятор знижує споживання вдвічі.\n• Ефективність — м'яке інфрачервоне тепло гріє знизу, ефективніше за лампи.\n• Вологозахист — герметична плівка не боїться вологи та бруду.\n• Ручна збірка — кожен килимок збирається вручну з контролем контактів, служить 5–10 років.\n\nКомплектація: вологозахищений регулятор, кабель 3 м з євровилкою. Максимальний нагрів — 40°C, робоча температура ~30–35°C (як тепло справжньої квочки).\n\nПідходить для птахівництва, рослинництва та тваринництва. Доступні довжини від 20 до 780 см.",
  productPrice: 799,
  productOldPrice: 1140,
  productImage: IMG,
  productImages: [IMG],
  ctaText: "Замовити зараз",
  bgColor: "#F6F5F2",
  btnColor: "#FF7A00",
  textColor: "#1A1A1A",
  metaTitle: "Килимок OZO Преміум — тепла підстилка для пташенят | OZO",
  metaDescription:
    "Килимок OZO Преміум — безпечне інфрачервоне тепло для курчат, каченят, індичат та перепелів. Збережіть 99% молодняку. Оплата при отриманні, доставка Новою Поштою 1–2 дні.",
  reviews: [
    { name: "Іван", city: "Полтавська обл.", text: "Курчата перестали гинути, як тільки поставив килимок замість лампи. Гріє рівномірно, малята спокійно сплять і не тиснуться. Дуже задоволений!", avatar: "", rating: 5 },
    { name: "Олена", city: "Київська обл.", text: "Значна економія на світлі — лічильник майже не крутиться. Виводок вижив повністю, 100%. Рекомендую кожному птахівнику!", avatar: "", rating: 5 },
    { name: "Сергій", city: "Хмельницька обл.", text: "Швидка доставка — прийшло за 2 дні Новою Поштою. Килимок якісний, вологи не боїться. Вже другу зиму працює без нарікань.", avatar: "", rating: 5 },
    { name: "Марія", city: "Вінницька обл.", text: "Замовила 3 шт для індичат. Окупилося з першого виводку. Пташенята ростуть активними, без перегріву. Дякую за консультацію!", avatar: "", rating: 5 },
  ],
  advantages: [
    { icon: "zap", title: "30 Вт економії", desc: "Споживає менше за звичайну лампочку — рахунок за світло в рази менший." },
    { icon: "temp", title: "Ідеальна температура 38–40°C", desc: "Пташенята не кучкуються, не мерзнуть та ростуть швидше." },
    { icon: "drop", title: "Вологозахищений", desc: "Не боїться води, посліду та легко миється." },
    { icon: "shield", title: "100% безпека", desc: "Вбудований захист від перегріву — працює 24/7 без нагляду." },
  ],
  useCases: ["🐣 Курчат і бройлерів", "🦆 Каченят та індичат", "🐥 Перепелів", "🐇 Кролів і тварин"],
  stockCount: 584,
  discountPercent: 30,
  isPublished: false,
}

async function main() {
  const existing = await prisma.landingPage.findUnique({ where: { slug: landing.slug } })

  const { slug, ...rest } = landing

  if (existing) {
    await prisma.landingPage.update({ where: { id: existing.id }, data: rest })
    console.log(`Лендінг «${landing.title}» ОНОВЛЕНО (id ${existing.id})`)
  } else {
    const lp = await prisma.landingPage.create({ data: landing })
    console.log(`Лендінг «${landing.title}» СТВОРЕНО (id ${lp.id})`)
  }

  console.log(`Посилання: /lp/${landing.slug}`)
  console.log("Статус: чернетка. Опублікуйте в адмінці (Лендінги) після перевірки.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
