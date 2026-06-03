import { NextResponse } from "next/server"
import { requireAdminOr401 } from "@/lib/admin-api"
import fs from "fs/promises"
import path from "path"

const SETTINGS_PATH = path.join(process.cwd(), "settings.json")

async function readSettings() {
  const raw = await fs.readFile(SETTINGS_PATH, "utf-8")
  return JSON.parse(raw)
}

async function writeSettings(data: unknown) {
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8")
}

export async function GET() {
  const guard = await requireAdminOr401()
  if (guard) return guard

  try {
    const settings = await readSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("SETTINGS_READ_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося прочитати налаштування" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  try {
    const body = await req.json()
    const current = await readSettings()

    if (body.codWarning) {
      current.codWarning = { ...current.codWarning, ...body.codWarning }
    }

    await writeSettings(current)
    return NextResponse.json(current)
  } catch (error) {
    console.error("SETTINGS_WRITE_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося зберегти налаштування" }, { status: 500 })
  }
}
