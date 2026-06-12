import { NextResponse } from "next/server"
import { readFile, access } from "node:fs/promises"
import path from "node:path"

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
}

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params

  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse(null, { status: 400 })
  }

  const ext = path.extname(filename).toLowerCase()
  const contentType = MIME[ext] ?? "application/octet-stream"

  const absPath = path.join(process.cwd(), "public", "uploads", filename)

  try {
    await access(absPath)
  } catch {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const buf = await readFile(absPath)

    // .webp files are immutable (content-addressed by UUID) → cache 1 year
    const cacheControl = ext === ".webp"
      ? "public, max-age=31536000, immutable"
      : "public, max-age=0, must-revalidate"

    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
