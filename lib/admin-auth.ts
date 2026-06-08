import crypto from "node:crypto" // Змінюємо імпорт для кращої сумісності

export const ADMIN_SESSION_COOKIE = "ozo_admin_session"
export const ADMIN_ENTRY_HEADER = "x-ozo-admin-entry"

export function normalizePathname(pathname: string): string {
  let p = pathname
  while (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1)
  }
  return p
}

export function parseAdminGatePath(): string | null {
  const raw = process.env.ADMIN_GATE_PATH
  if (!raw) return null
  const trimmed = String(raw).trim()
  if (!trimmed || trimmed.includes("?") || trimmed.includes("#") || !trimmed.startsWith("/") || trimmed.includes("..")) return null
  const norm = normalizePathname(trimmed)
  if (norm === "/" || norm === "/admin") return null
  return norm
}

export function adminSessionTokenValue(): string | null {
  const login = process.env.ADMIN_LOGIN?.trim()
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!login || !password) return null
  return crypto
    .createHmac("sha256", `${login}:${password}`)
    .update("ozo-admin-session-v2")
    .digest("hex")
}

export function adminEntrySecretValue(): string | null {
  const login = process.env.ADMIN_LOGIN?.trim()
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!login || !password) return null
  const gate = parseAdminGatePath()
  if (!gate) return null
  return crypto.createHmac("sha256", password).update(`ozo-admin-entry|${gate}`).digest("hex")
}

export function verifyAdminSessionCookie(value: string | undefined): boolean {
  const expected = adminSessionTokenValue()
  if (!expected || !value) return false
  try {
    // Використовуємо вбудований crypto для безпечного порівняння
    return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected))
  } catch {
    return false
  }
}
