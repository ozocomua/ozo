/**
 * Signed admin session for Edge middleware and Node route handlers.
 * Set `ADMIN_ACCESS_SECRET` in `.env` (server-only, never NEXT_PUBLIC_*).
 * Open admin: go to `/admin/gate`, enter the secret, then you are redirected to `/admin`.
 */
const COOKIE_NAME = "brosco_admin"
const TOKEN_PREFIX = "v1"
const te = new TextEncoder()

function toBase64Url(data: Uint8Array): string {
  let bin = ""
  for (let i = 0; i < data.length; i++) bin += String.fromCharCode(data[i])
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "====".slice(s.length % 4)
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const ADMIN_SESSION_COOKIE = COOKIE_NAME

/** Default session length: 7 days */
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export async function createAdminSessionToken(
  secret: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): Promise<string> {
  const exp = Date.now() + maxAgeMs
  const payload = JSON.stringify({ exp })
  const payloadBytes = te.encode(payload)
  const key = await importHmacKey(secret)
  const sig = await crypto.subtle.sign("HMAC", key, payloadBytes)
  const sigStr = toBase64Url(new Uint8Array(sig))
  const p64 = toBase64Url(payloadBytes)
  return `${TOKEN_PREFIX}.${p64}.${sigStr}`
}

export async function verifyAdminSessionToken(
  secret: string,
  token: string | undefined
): Promise<{ ok: boolean }> {
  if (!secret || !token?.startsWith(`${TOKEN_PREFIX}.`)) return { ok: false }
  const rest = token.slice(TOKEN_PREFIX.length + 1)
  const dot = rest.indexOf(".")
  if (dot <= 0) return { ok: false }
  const p64 = rest.slice(0, dot)
  const sig64 = rest.slice(dot + 1)
  if (!p64 || !sig64) return { ok: false }
  let payloadBytes: Uint8Array
  try {
    payloadBytes = fromBase64Url(p64)
  } catch {
    return { ok: false }
  }
  let data: { exp?: number }
  try {
    data = JSON.parse(new TextDecoder().decode(payloadBytes)) as { exp?: number }
  } catch {
    return { ok: false }
  }
  if (typeof data.exp !== "number" || !Number.isFinite(data.exp) || Date.now() > data.exp) {
    return { ok: false }
  }
  const key = await importHmacKey(secret)
  const expected = await crypto.subtle.sign("HMAC", key, payloadBytes)
  const expectedStr = toBase64Url(new Uint8Array(expected))
  if (!timingSafeEqual(sig64, expectedStr)) return { ok: false }
  return { ok: true }
}

/** Safe redirect target after login: only under `/admin`, never `/admin/gate`. */
export function sanitizeAdminNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/admin")) return "/admin"
  if (raw.startsWith("/admin/gate")) return "/admin"
  if (raw.includes("//") || raw.includes("\\")) return "/admin"
  return raw
}
