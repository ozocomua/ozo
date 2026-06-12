import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { requireAdminOr401 } from "@/lib/admin-api"
import { optimize, isImage } from "@/lib/image-optimizer"

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buf = Buffer.from(bytes)
  if (!buf.length) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 })
  }

  if (!isImage(buf)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
  }

  // ── Optimize: resize → webp ─────────────────────────────────
  const result = await optimize(buf)

  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })

  const id = crypto.randomUUID()
  const filename = `${id}.webp`
  const abs = path.join(uploadDir, filename)
  await writeFile(abs, result.buffer)

  const url = `/api/image/${filename}`

  return NextResponse.json({
    url,
    optimized: {
      width: result.width,
      height: result.height,
      size: result.optimizedSize,
      reductionPercent: result.reductionPercent,
    },
  })
}
