import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

async function ensureCategory(): Promise<number> {
  const existing = await prisma.category.findFirst({ where: { name: "Тест" } })
  if (existing) return existing.id
  const created = await prisma.category.create({
    data: { name: "Тест", slug: "test" },
  })
  return created.id
}

async function ensureBrand(): Promise<number> {
  const existing = await prisma.brand.findFirst({ where: { name: "Тест" } })
  if (existing) return existing.id
  const created = await prisma.brand.create({
    data: { name: "Тест", slug: "test" },
  })
  return created.id
}

async function seed() {
  const categoryId = await ensureCategory()
  const brandId = await ensureBrand()

  const names = [
    "Напувалка ніпельна",
    "Годівниця бункерна",
    "Поїлка вакуумна",
    "Годівниця лінійна",
    "Килимок нагрівальний",
    "Лампа інфрачервона",
    "Клітка для курчат",
    "Сідало дерев'яне",
    "Гніздо для курей",
    "Інкубатор компактний",
    "Яйцезбірник",
    "Піддон для посліду",
    "Годівниця навісна",
    "Напувалка чашкова",
    "Терморегулятор",
    "Вентилятор для інкубатора",
    "Обігрівач керамічний",
    "Килимок гумовий",
    "Сітка оцинкована",
    "Кріплення для напувалок",
    "Шланг ПВХ",
    "Кран-регулятор",
    "Фільтр для води",
    "Годівниця для перепелів",
    "Напувалка мікрочашкова",
    "Труба квадратна 25 мм",
    "Заглушка пластикова",
    "Хомут кріпильний",
    "Ємність для води 30 л",
    "Поплавковий клапан",
  ]

  for (let i = 0; i < names.length; i++) {
    const name = `ТЕСТ ${names[i]} #${i + 1}`
    const slug = `test-${slugify(names[i])}-${i + 1}`
    const sku = `TEST-${(i + 1).toString().padStart(3, "0")}`

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        description: `Опис ${name}`,
        fullDescription: `<p>Повний опис ${name}</p>`,
        isPublished: true,
        isPopular: i < 5,
        price: 100 + i * 7,
        stock: 5,
        volume: "500 мл",
        status: "PUBLISHED",
        brandId,
        categories: {
          create: { categoryId },
        },
        images: {
          create: {
            url: "/placeholder.jpg",
            sort: 0,
            isMain: true,
          },
        },
        variants: {
          create: {
            sku: `${sku}-V1`,
            volume: "500 мл",
            packageType: "Флакон",
            priceRetail: 100 + i * 7,
            stock: 5,
          },
        },
      },
    })

    console.log(`✅ #${i + 1}: ${product.name} (slug: ${product.slug})`)
  }

  console.log("\n🎉 Усі 30 товарів створено!")
}

seed()
  .catch((e) => {
    console.error("❌ Помилка:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
