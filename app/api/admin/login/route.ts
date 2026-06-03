import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, adminSessionTokenValue } from "@/lib/admin-auth"

function timingSafeStringEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length)
  let out = a.length === b.length ? 0 : 1
  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0
    const cb = i < b.length ? b.charCodeAt(i) : 0
    out |= ca ^ cb
  }
  return out === 0
}

export async function POST(req: Request) {
  const expectedLogin = process.env.ADMIN_LOGIN?.trim()
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim()
  const token = adminSessionTokenValue()

  if (!expectedLogin || !expectedPassword || !token) {
    return NextResponse.json({ error: "Адмін-доступ не налаштовано." }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Некоректне тіло запиту." }, { status: 400 })
  }

  const givenLogin =
    typeof body === "object" &&
    body !== null &&
    "login" in body &&
    typeof (body as { login: unknown }).login === "string"
      ? (body as { login: string }).login
      : ""

  const givenPassword =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : ""

  if (!timingSafeStringEqual(givenLogin, expectedLogin)) {
    return NextResponse.json({ error: "Невірний логін або пароль." }, { status: 401 })
  }

  if (!timingSafeStringEqual(givenPassword, expectedPassword)) {
    return NextResponse.json({ error: "Невірний логін або пароль." }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  const forwardedProto = req.headers.get("x-forwarded-proto")?.toLowerCase()
  const isHttps = forwardedProto === "https" || new URL(req.url).protocol === "https:"
  const secure = process.env.NODE_ENV === "production" && isHttps
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
