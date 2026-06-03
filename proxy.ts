import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  ADMIN_ENTRY_HEADER,
  ADMIN_SESSION_COOKIE,
  adminEntrySecretValue,
  normalizePathname,
  parseAdminGatePath,
  verifyAdminSessionCookie,
} from "@/lib/admin-auth"

let loggedInvalidAdminGatePath = false
let loggedAdminGatePathWithoutCredentials = false

function logInvalidAdminGatePathOnce() {
  if (loggedInvalidAdminGatePath) return
  loggedInvalidAdminGatePath = true
  console.warn("[brosco/admin] ADMIN_GATE_PATH is invalid or unsafe; admin is disabled.")
}

function logGatePathWithoutPasswordOnce() {
  if (loggedAdminGatePathWithoutCredentials) return
  loggedAdminGatePathWithoutCredentials = true
  console.warn("[brosco/admin] ADMIN_GATE_PATH is set but ADMIN_PASSWORD is missing; admin is disabled.")
}

export function proxy(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname)

  const rawGateEnv = process.env.ADMIN_GATE_PATH
  const rawGateTrimmed = rawGateEnv?.trim() ?? ""
  const parsedGatePath = parseAdminGatePath()
  if (rawGateTrimmed && !parsedGatePath) {
    logInvalidAdminGatePathOnce()
  }

  const hasCredentials = Boolean(
    process.env.ADMIN_LOGIN?.trim() && process.env.ADMIN_PASSWORD?.trim()
  )
  const secretAdminPath = parsedGatePath && hasCredentials ? parsedGatePath : null

  if (parsedGatePath && !hasCredentials) {
    logGatePathWithoutPasswordOnce()
  }

  const isAdminSection = pathname === "/admin" || pathname.startsWith("/admin/")
  const isSecretAdminRequest = Boolean(
    secretAdminPath &&
      (pathname === secretAdminPath || pathname.startsWith(`${secretAdminPath}/`))
  )

  if (isAdminSection) {
    return new NextResponse(null, { status: 404 })
  }

  if (!secretAdminPath || !isSecretAdminRequest) {
    return NextResponse.next()
  }

  const entrySecret = adminEntrySecretValue()
  if (!entrySecret) {
    return new NextResponse(null, { status: 404 })
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(ADMIN_ENTRY_HEADER, entrySecret)

  const cookieVal = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (verifyAdminSessionCookie(cookieVal)) {
    const rest = pathname.slice(secretAdminPath.length)
    const destPath = rest ? `/admin${rest}` : "/admin"
    return NextResponse.rewrite(new URL(destPath, request.url), {
      request: { headers: requestHeaders },
    })
  }

  return NextResponse.rewrite(new URL("/admin/gate", request.url), {
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next/|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg)).*)",
  ],
}
