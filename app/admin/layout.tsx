import type { Metadata } from "next"
import { headers, cookies } from "next/headers"
import { notFound } from "next/navigation"
import { ADMIN_ENTRY_HEADER, ADMIN_SESSION_COOKIE, adminEntrySecretValue, verifyAdminSessionCookie } from "@/lib/admin-auth"
import { AdminHeader } from "./admin-header"

export const metadata: Metadata = {
  title: "Адмін — OZO",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const expected = adminEntrySecretValue()
  const got = h.get(ADMIN_ENTRY_HEADER)

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const sessionValid = verifyAdminSessionCookie(sessionCookie)

  const authorized =
    (expected && got === expected) || sessionValid

  if (!authorized) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-foreground">
      <AdminHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
