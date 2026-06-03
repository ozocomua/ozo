import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function clean() {
  const productIds = await prisma.product.findMany({
    where: { name: { startsWith: "ТЕСТ " } },
    select: { id: true },
  })

  if (productIds.length === 0) {
    console.log("✅ Немає тестових товарів для видалення.")
    return
  }

  console.log(`🔍 Знайдено ${productIds.length} тестових товарів.`)

  const ids = productIds.map((p) => p.id)

  await prisma.productImage.deleteMany({ where: { productId: { in: ids } } })
  await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } })
  await prisma.productCategory.deleteMany({ where: { productId: { in: ids } } })
  await prisma.product.deleteMany({ where: { id: { in: ids } } })

  console.log(`🧹 Видалено ${productIds.length} товарів та всі пов'язані дані.`)

  const testCategory = await prisma.category.findFirst({ where: { name: "Тест" } })
  if (testCategory) {
    const productsInCategory = await prisma.productCategory.count({
      where: { categoryId: testCategory.id },
    })
    if (productsInCategory === 0) {
      await prisma.category.delete({ where: { id: testCategory.id } })
      console.log("🗑️ Категорію «Тест» також видалено.")
    }
  }

  const testBrand = await prisma.brand.findFirst({ where: { name: "Тест" } })
  if (testBrand) {
    const productsWithBrand = await prisma.product.count({
      where: { brandId: testBrand.id },
    })
    if (productsWithBrand === 0) {
      await prisma.brand.delete({ where: { id: testBrand.id } })
      console.log("🗑️ Бренд «Тест» також видалено.")
    }
  }

  console.log("\n🎉 Готово!")
}

clean()
  .catch((e) => {
    console.error("❌ Помилка:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
