import { NextResponse } from "next/server"

/**
 * Список замовлень користувача — підключимо після авторизації / адмін-панелі
 * (раніше тут були next-auth та lib/auth, яких немає в проєкті — ламали збірку).
 */
export async function GET() {
  return NextResponse.json(
    { error: "Авторизацію ще не підключено. Ендпоінт зарезервовано під кабінет / адмінку." },
    { status: 501 }
  )
}
