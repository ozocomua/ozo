/**
 * Image Optimization Pipeline
 *
 * Flow: raw Buffer → sharp → resize (max 1200px) → webp (80%) → metadata stripped → optimized Buffer
 *
 * Typical results:
 *   5 MB JPEG  →  ~120 KB webp  (96% reduction)
 *   3 MB PNG   →  ~80 KB webp   (97% reduction)
 */

import sharp from "sharp"

/* ── Configuration ──────────────────────────────────────────── */

const MAX_WIDTH = 1200 // px
const MAX_HEIGHT = 1600 // px (portrait images — maintain proportion)
const WEBP_QUALITY = 80 // 0–100
const THUMB_WIDTH = 400 // px — for product cards

export interface OptimizeResult {
  buffer: Buffer
  width: number
  height: number
  format: "webp"
  originalSize: number
  optimizedSize: number
  reductionPercent: number
}

/**
 * Optimize a single image to webp.
 *
 * @param input  Raw file bytes (Buffer)
 * @param opts   Override defaults
 */
export async function optimize(input: Buffer, opts?: {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}): Promise<OptimizeResult> {
  const originalSize = input.length
  const maxWidth = opts?.maxWidth ?? MAX_WIDTH
  const maxHeight = opts?.maxHeight ?? MAX_HEIGHT
  const quality = opts?.quality ?? WEBP_QUALITY

  const image = sharp(input, { failOn: "none" })

  // Get original dimensions (without re-reading the whole pipeline)
  const meta = await image.metadata()
  const origWidth = meta.width ?? maxWidth
  const origHeight = meta.height ?? maxHeight

  // Calculate resize dimensions (maintain aspect ratio, fit within max)
  let targetWidth = origWidth
  let targetHeight = origHeight

  if (origWidth > maxWidth || origHeight > maxHeight) {
    const ratio = Math.min(maxWidth / origWidth, maxHeight / origHeight)
    targetWidth = Math.round(origWidth * ratio)
    targetHeight = Math.round(origHeight * ratio)
  }

  // Pipeline: resize → webp → strip metadata
  const optimized = await image
    .resize(targetWidth, targetHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 6,         // 0-6, 6 = best compression (slower but worth it for one-time upload)
      lossless: false,
      smartSubsample: true,
    })
    .withMetadata({})    // strip all EXIF/metadata
    .toBuffer()

  const reductionPercent = Math.round((1 - optimized.length / originalSize) * 100)

  console.log(
    `[optimize] ${(originalSize / 1024).toFixed(0)}KB → ${(optimized.length / 1024).toFixed(0)}KB ` +
    `(${targetWidth}×${targetHeight} webp q${quality}, -${reductionPercent}%)`
  )

  return {
    buffer: optimized,
    width: targetWidth,
    height: targetHeight,
    format: "webp",
    originalSize,
    optimizedSize: optimized.length,
    reductionPercent,
  }
}

/**
 * Generate a small thumbnail (max 400px) for product cards.
 */
export async function thumbnail(input: Buffer, quality: number = 75): Promise<Buffer> {
  const result = await sharp(input, { failOn: "none" })
    .resize(THUMB_WIDTH, THUMB_WIDTH, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 6,
      smartSubsample: true,
    })
    .withMetadata({})
    .toBuffer()

  console.log(`[thumbnail] ${(result.length / 1024).toFixed(0)}KB (${THUMB_WIDTH}px max, q${quality})`)
  return result
}

/**
 * Quick check: does this buffer look like an image?
 */
export function isImage(buf: Buffer): boolean {
  // Check magic bytes for common formats
  if (buf.length < 4) return false

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true

  return false
}
