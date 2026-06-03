import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-auth"

export async function requireAdminOr401(): Promise<NextResponse | null> {
  const store = await cookies()
  const token = store.get(ADMIN_SESSION_COOKIE)?.value
  if (!verifyAdminSessionCookie(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

