import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { requireAdminOr401 } from "@/lib/admin-api"

function safeExt(name: string): string {
  const ext = path.extname(name).toLowerCase()
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp") return ext
  return ""
}

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

  const ext = safeExt(file.name)
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buf = Buffer.from(bytes)
  if (!buf.length) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })

  const id = crypto.randomUUID()
  const filename = `${id}${ext}`
  const abs = path.join(uploadDir, filename)
  await writeFile(abs, buf)

  const url = `/api/image/${filename}`
  return NextResponse.json({ url })
}

