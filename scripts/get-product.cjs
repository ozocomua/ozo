#!/usr/bin/env node
/**
 * Виводить повну інформацію про товар за SKU (запускати в ~/ozo):
 *   node scripts/get-product.cjs A000007
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

async function main() {
  const sku = (process.argv[2] || "").trim()
  if (!sku) {
    console.error("Вкажіть SKU: node scripts/get-product.cjs A000007")
    process.exit(1)
  }

  const p = await prisma.product.findUnique({
    where: { sku },
    include: {
      brand: { select: { name: true } },
      categories: { include: { category: { select: { name: true, slug: true } } } },
      images: { orderBy: { sort: "asc" }, select: { url: true, alt: true, isMain: true } },
      variants: { orderBy: { id: "asc" }, select: { sku: true, volume: true, packageType: true, priceRetail: true, priceWholesale: true, stock: true } },
    },
  })

  if (!p) {
    console.error("Товар не знайдено за SKU:", sku)
    process.exit(1)
  }

  console.log(JSON.stringify(p, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
