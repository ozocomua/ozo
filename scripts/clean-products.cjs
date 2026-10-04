#!/usr/bin/env node
/**
 * Утиліта для роботи з товарами на сервері. Запускати з папки ~/ozo:
 *
 *   node scripts/clean-products.cjs
 *     -> вивести кількість і повний список товарів (id, SKU, назва, статус)
 *
 *   node scripts/clean-products.cjs --delete-except SKU1 SKU2 SKU3 ...
 *     -> видалити ВСІ товари, КРІМ тих, чиї SKU вказані (файли фото теж видаляються)
 */
const fs = require("fs")
const path = require("path")
const { unlink } = require("fs/promises")

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

const env = loadEnv()
process.env.DATABASE_URL = env.DATABASE_URL

const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function deleteFilesByUrls(urls) {
  let deleted = 0
  for (const url of urls) {
    if (!url) continue
    const m = url.match(/\/api\/image\/([^?#]+)/)
    if (!m) continue
    const name = m[1]
    if (name.includes("..") || name.includes("/") || name.includes("\\")) continue
    try {
      await unlink(path.join(process.cwd(), "public", "uploads", name))
      deleted++
    } catch {
      // файл вже відсутній — ок
    }
  }
  return deleted
}

async function list() {
  const count = await prisma.product.count()
  console.log("Всього товарів:", count)
  console.log("----------------------------------------------")
  const rows = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, isPublished: true },
    orderBy: { id: "asc" },
  })
  for (const r of rows) {
    console.log(`${r.id}\t${r.sku}\t${r.name}\t${r.isPublished ? "опубліковано" : "чернетка"}`)
  }
}

async function deleteExcept(keepSkus) {
  const keep = new Set(keepSkus.map((s) => s.trim()).filter(Boolean))
  const targets = await prisma.product.findMany({
    where: { sku: { notIn: Array.from(keep) } },
    select: { id: true, sku: true, name: true, images: { select: { url: true } } },
  })

  if (!targets.length) {
    console.log("Нічого видаляти — всі товари в списку «залишити».")
    return
  }

  console.log(`Буде видалено ${targets.length} товар(ів). Залишаються: ${Array.from(keep).join(", ")}`)
  const urls = targets.flatMap((p) => p.images.map((i) => i.url))
  const ids = targets.map((p) => p.id)

  const res = await prisma.product.deleteMany({ where: { id: { in: ids } } })
  const deletedFiles = await deleteFilesByUrls(urls)
  console.log(`Готово. Видалено товарів: ${res.count}, файлів: ${deletedFiles}`)
}

async function main() {
  const args = process.argv.slice(2)
  const idx = args.indexOf("--delete-except")
  if (idx !== -1) {
    const keepSkus = args.slice(idx + 1)
    if (!keepSkus.length) {
      console.error("Вкажіть SKU, які залишити:")
      console.error("  node scripts/clean-products.cjs --delete-except SKU1 SKU2 SKU3")
      process.exit(1)
    }
    await deleteExcept(keepSkus)
  } else {
    await list()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
