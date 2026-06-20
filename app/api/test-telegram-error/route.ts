import { NextResponse } from "next/server"
import { sendErrorToTelegram } from "@/lib/telegram"

/**
 * Тимчасовий тестовий ендпоінт для перевірки Telegram-сповіщень про помилки.
 * Видалити після успішного тесту!
 */
export async function GET() {
  try {
    await sendErrorToTelegram({
      source: "test-telegram-error",
      message: "🧪 Це тестова помилка! Telegram-сповіщення працює — всі реальні помилки тепер приходитимуть сюди.",
      stack: "test-stack: at testEndpoint (route.ts:12:5)\n  at handler (route.ts:8:3)",
    })

    return NextResponse.json({
      success: true,
      message: "Тестова помилка відправлена в Telegram. Перевір чат бота.",
    })
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Невідома помилка",
    })
  }
}
