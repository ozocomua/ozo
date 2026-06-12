/**
 * Migration script: convert all existing images to WebP and update database.
 *
 * Run once from the project root:
 *   npx tsx --compiler-options '{"module":"esnext","moduleResolution":"bundler"}' scripts/migrate-images-to-webp.ts
 *
 * Or more reliably:
 *   node --loader ts-node/esm scripts/migrate-images-to-webp.ts
 *
 * What it does:
 *   1. Find all .jpg/.jpeg/.png in public/uploads/
 *   2. Convert each to .webp using sharp (1200px max, quality 80%)
 *   3. Update all Category.imageUrl records in DB (find/replace extension)
 *   4. Update all ProductImage.url records in DB
 *   5. Delete original files after successful DB update
 */

import { readdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
const MAX_WIDTH = 1200
const WEBP_QUALITY = 80

interface Conversion {
  oldFile: string
  newFile: string
  oldUrl: string
  newUrl: string
  oldSize: number
  newSize: number
}

async function convertImage(filePath: string): Promise<{ buffer: Buffer; newName: string }> {
  const ext = path.extname(filePath).toLowerCase()
  const baseName = path.basename(filePath, ext)
  const newName = `${baseName}.webp`

  const result = await sharp(filePath)
    .resize(MAX_WIDTH, MAX_WIDTH, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: true })
    .withMetadata({})
    .toBuffer()

  return { buffer: result, newName }
}

async function main() {
  console.log("[migrate-images] Scanning uploads/ for non-webp files...")

  const entries = await readdir(UPLOAD_DIR)
  const imageFiles = entries.filter((f) => {
    const ext = path.extname(f).toLowerCase()
    return ext === ".jpg" || ext === ".jpeg" || ext === ".png"
  })

  if (imageFiles.length === 0) {
    console.log("[migrate-images] No non-webp files found. All good!")
    await prisma.$disconnect()
    return
  }

  console.log(`[migrate-images] Found ${imageFiles.length} files to convert`)

  const conversions: Conversion[] = []

  for (const file of imageFiles) {
    const filePath = path.join(UPLOAD_DIR, file)
    const ext = path.extname(file).toLowerCase()
    const oldUrl = `/api/image/${file}`
    const newUrl = `/api/image/${path.basename(file, ext)}.webp`

    console.log(`[migrate-images] Converting: ${file}...`)

    try {
      const { buffer, newName } = await convertImage(filePath)
      const newPath = path.join(UPLOAD_DIR, newName)
      await writeFile(newPath, buffer)

      const oldStat = await require("node:fs/promises").stat(filePath)
      const newStat = await require("node:fs/promises").stat(newPath)

      conversions.push({
        oldFile: file,
        newFile: newName,
        oldUrl,
        newUrl,
        oldSize: oldStat.size,
        newSize: newStat.size,
      })

      console.log(
        `  ✓ ${(oldStat.size / 1024).toFixed(0)}KB → ${(newStat.size / 1024).toFixed(0)}KB (${Math.round((1 - newStat.size / oldStat.size) * 100)}% smaller)`
      )
    } catch (err) {
      console.error(`  ✗ Failed to convert ${file}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n[migrate-images] Converted ${conversions.length} files. Updating database...`)

  // Update Category imageUrls
  let catUpdated = 0
  for (const conv of conversions) {
    try {
      // Use raw SQL for reliable find-replace
      const result = await prisma.$executeRawUnsafe(
        `UPDATE Category SET imageUrl = ? WHERE imageUrl = ?`,
        conv.newUrl,
        conv.oldUrl,
      )
      catUpdated += result
    } catch {}
  }
  console.log(`  Categories updated: ${catUpdated}`)

  // Update ProductImage urls
  let imgUpdated = 0
  for (const conv of conversions) {
    try {
      const result = await prisma.$executeRawUnsafe(
        `UPDATE ProductImage SET url = ? WHERE url = ?`,
        conv.newUrl,
        conv.oldUrl,
      )
      imgUpdated += result
    } catch {}
  }
  console.log(`  ProductImages updated: ${imgUpdated}`)

  // Delete old files
  console.log(`\n[migrate-images] Deleting old files...`)
  let deleted = 0
  for (const conv of conversions) {
    try {
      await unlink(path.join(UPLOAD_DIR, conv.oldFile))
      deleted++
    } catch (err) {
      console.error(`  ✗ Failed to delete ${conv.oldFile}:`, err instanceof Error ? err.message : err)
    }
  }
  console.log(`  Deleted: ${deleted}/${conversions.length} old files`)

  // Summary
  const totalOld = conversions.reduce((s, c) => s + c.oldSize, 0)
  const totalNew = conversions.reduce((s, c) => s + c.newSize, 0)
  console.log(`\n[migrate-images] DONE!`)
  console.log(`  Files: ${conversions.length}`)
  console.log(`  Before: ${(totalOld / 1024 / 1024).toFixed(1)} MB`)
  console.log(`  After:  ${(totalNew / 1024 / 1024).toFixed(1)} MB`)
  console.log(`  Saved:  ${Math.round((1 - totalNew / totalOld) * 100)}%`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error("[migrate-images] FAILED:", err)
  prisma.$disconnect().then(() => process.exit(1))
})
