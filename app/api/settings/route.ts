import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const SETTINGS_PATH = path.join(process.cwd(), "settings.json")

export async function GET() {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8")
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({
      codWarning: {
        enabled: true,
        title: "Накладений платіж",
        message: "При оплаті накладеним платежем ви додатково сплачуєте 2% від суми переказу + 20 грн",
        okLabel: "ОК, зрозуміло",
        cancelLabel: "Скасувати",
      },
    })
  }
}
