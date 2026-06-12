/**
 * File cleanup utilities for uploaded images.
 *
 * When a product/category is deleted or updated with new images,
 * the old .webp files on disk should be cleaned up.
 */

import { unlink } from "node:fs/promises"
import path from "node:path"

/**
 * Delete a single uploaded file by its URL.
 *
 * URL format: /api/image/{filename}
 * File location: public/uploads/{filename}
 */
export async function deleteUploadByUrl(url: string | null | undefined): Promise<boolean> {
  if (!url) return false

  const filename = extractFilename(url)
  if (!filename) return false

  const abs = path.join(process.cwd(), "public", "uploads", filename)

  try {
    await unlink(abs)
    console.log(`[cleanup] deleted ${filename}`)
    return true
  } catch {
    // File may already be deleted — that's fine
    return false
  }
}

/**
 * Delete multiple uploaded files by URL array.
 * Returns count of successfully deleted files.
 */
export async function deleteUploadsByUrls(urls: Array<string | null | undefined>): Promise<number> {
  let deleted = 0
  const results = await Promise.allSettled(urls.map((url) => deleteUploadByUrl(url)))
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) deleted++
  }
  console.log(`[cleanup] deleted ${deleted}/${urls.length} files`)
  return deleted
}

/**
 * Extract filename from /api/image/{filename} URL.
 */
function extractFilename(url: string): string | null {
  // Match /api/image/{filename} or /api/image/{filename}?params
  const match = url.match(/\/api\/image\/([^?#]+)/)
  if (!match) return null
  const name = match[1]
  // Safety: reject path traversal
  if (name.includes("..") || name.includes("/") || name.includes("\\")) return null
  return name
}
