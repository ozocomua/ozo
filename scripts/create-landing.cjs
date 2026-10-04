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
  title: "Збережіть 99% пташенят з перших днів життя з теплою підстилкою OZO Преміум",
  subtitle: "Безпечне, рівномірне та економне інфрачервоне тепло. Пташенята не мерзнуть, не тиснуться та ростуть у 1.5 рази швидше.",
  productName: "Килимок OZO Преміум",
  productDesc:
    "Нагрівальний інфрачервоний килимок OZO Преміум — флагманське рішення для професійного обігріву брудерів, розсадних стелажів та вольєрів. Ширина 50 см, довжина під замовлення (крок 20 см, до 10 метрів).\n\nЧому обирають OZO Преміум:\n• Економічність — лише 110 Вт на 1 метр, регулятор знижує споживання вдвічі.\n• Ефективність — м'яке інфрачервоне тепло гріє знизу, ефективніше за лампи.\n• Вологозахист — герметична плівка не боїться вологи та бруду.\n• Ручна збірка — кожен килимок збирається вручну з контролем контактів, служить 5–10 років.\n\nКомплектація: вологозахищений регулятор, кабель 3 м з євровилкою. Максимальний нагрів — 40°C, робоча температура ~30–35°C (як тепло справжньої квочки).\n\nПідходить для птахівництва, рослинництва та тваринництва. Доступні довжини від 20 до 780 см.",
  productPrice: 599,
  productOldPrice: 850,
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
    { icon: "temp", title: "М'яке та рівномірне тепло", desc: "Нагрівається до оптимальних 38–40°C. Пташенята не кучкуються та не тиснуть одне одного." },
    { icon: "drop", title: "Вологозахист та простота догляду", desc: "Легко миється та дезінфікується. Не боїться посліду та випадково розлитої води." },
    { icon: "zap", title: "Економічна вигода", desc: "Окупається вже з першого виводку за рахунок збереження поголів'я та економії електроенергії." },
    { icon: "flame", title: "Пожежобезпечність", desc: "Вбудований захист від перегріву. Можна спокійно залишати увімкненим 24/7." },
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
