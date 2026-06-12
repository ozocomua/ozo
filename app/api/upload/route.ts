import { NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { optimize, isImage } from "@/lib/image-optimizer"

export async function POST(request: Request) {
  try {
    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    // File size limit: 10 MB
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buf = Buffer.from(bytes)

    if (!isImage(buf)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    // ── Optimize: resize → webp ───────────────────────────────
    const result = await optimize(buf)

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })

    // Generate filename: timestamp-random-sanitized.webp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const baseName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.[^.]+$/, "")
    const finalName = `${uniqueSuffix}-${baseName}.webp`
    const filePath = path.join(uploadDir, finalName)

    // Save optimized buffer
    await writeFile(filePath, result.buffer)

    const publicUrl = `/api/image/${finalName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      optimized: {
        width: result.width,
        height: result.height,
        size: result.optimizedSize,
        reductionPercent: result.reductionPercent,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Upload error:", message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
