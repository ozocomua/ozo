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
  title: "Нагрівальний килимок OZO Преміум",
  subtitle: "Інфрачервоне тепло для курчат, розсади та тварин — вологозахист, економні 110 Вт/м, ручна збірка",
  productName: "Килимок OZO Преміум (50 × 20 см)",
  productDesc:
    "Нагрівальний інфрачервоний килимок OZO Преміум — флагманське рішення для професійного обігріву брудерів, розсадних стелажів та вольєрів. Ширина 50 см, довжина під замовлення (крок 20 см, до 10 метрів).\n\nЧому обирають OZO Преміум:\n• Економічність — лише 110 Вт на 1 метр, регулятор знижує споживання вдвічі.\n• Ефективність — м'яке інфрачервоне тепло гріє знизу, ефективніше за лампи.\n• Вологозахист — герметична плівка не боїться вологи та бруду.\n• Ручна збірка — кожен килимок збирається вручну з контролем контактів, служить 5–10 років.\n\nКомплектація: вологозахищений регулятор, кабель 3 м з євровилкою. Максимальний нагрів — 40°C, робоча температура ~30–35°C (як тепло справжньої квочки).\n\nПідходить для птахівництва, рослинництва та тваринництва. Доступні довжини від 20 до 780 см.",
  productPrice: 600,
  productOldPrice: null,
  productImage: IMG,
  productImages: [IMG],
  ctaText: "Замовити",
  bgColor: "#F9F9F7",
  btnColor: "#0B53A4",
  textColor: "#111111",
  metaTitle: "Нагрівальний килимок OZO Преміум — інфрачервоний обігрів | OZO",
  metaDescription:
    "Нагрівальний килимок OZO Преміум (ширина 50 см) — економний інфрачервоний обігрів для курчат, розсади та тварин. Вологозахист, ручна збірка, доставка Новою Поштою по Україні.",
  reviews: [
    { name: "Ігор", city: "Київ", text: "Брав для брудера з курчатами. Гріє рівномірно, курчата активні, не кучкуються. Дуже задоволений!", avatar: "", rating: 5 },
    { name: "Тетяна", city: "Полтава", text: "Вирощую розсаду помідорів. Під килимком коріння тепле, сходи дружні. Найкраще придбання сезону.", avatar: "", rating: 5 },
    { name: "Микола", city: "Вінниця", text: "Тримаю кролів — взимку маточник гріє відмінно. Вологи не боїться, перевірено. Рекомендую.", avatar: "", rating: 5 },
    { name: "Олена", city: "Львів", text: "Замовляла на 3 метри під стелаж. Прийшло швидко, працює тихо, без запаху. Дякую!", avatar: "", rating: 5 },
    { name: "Сергій", city: "Дніпро", text: "Вже другий килимок беру. Перший служить 6 років без нарікань. Якість реально преміум.", avatar: "", rating: 5 },
    { name: "Наталя", city: "Харків", text: "Купувала для індичат. Виставила температуру регулятором — малята ростуть як на дріжджах. Дякую за консультацію!", avatar: "", rating: 5 },
  ],
  advantages: [
    { icon: "Zap", title: "Економічність", desc: "Лише 110 Вт на 1 метр. Посилений регулятор зменшує споживання вдвічі." },
    { icon: "Droplets", title: "Повний вологозахист", desc: "Герметична плівка не боїться вологи та бруду — навіть перевернута напувалка не зашкодить." },
    { icon: "Wrench", title: "Ручна збірка", desc: "Кожен килимок збирається вручну з контролем контактів. Служить 5–10 років." },
    { icon: "Check", title: "Гнучкі розміри", desc: "Будь-яка довжина до 10 метрів (крок 20 см) при фіксованій ширині 50 см." },
  ],
  useCases: ["🐣 Курчат і бройлерів", "🦆 Каченят та індичат", "🌱 Розсади та мікрозелені", "🐇 Кролів і тварин"],
  stockCount: 584,
  discountPercent: 0,
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
