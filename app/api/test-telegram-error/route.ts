import { NextResponse } from "next/server"
import { sendErrorToTelegram } from "@/lib/telegram"

/**
 * Тимчасовий тестовий ендпоінт для перевірки Telegram-сповіщень про помилки.
 * Видалити після успішного тесту!
 */
export async function GET() {
  const result = await sendErrorToTelegram({
    source: "test-telegram-error",
    message: `\u{1F9EA} Це тестова помилка! Telegram-сповіщення працює — всі реальні помилки тепер приходитимуть сюди.`,
    stack: "test-stack: at testEndpoint (route.ts:12:5)\n  at handler (route.ts:8:3)",
  })

  return NextResponse.json(result)
}
