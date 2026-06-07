import type { Metadata } from "next"
import { headers, cookies } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ADMIN_ENTRY_HEADER, ADMIN_SESSION_COOKIE, adminEntrySecretValue, verifyAdminSessionCookie } from "@/lib/admin-auth"
import { AdminNav } from "./admin-nav"
import { AdminLogoutButton } from "./logout-button"

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
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="font-serif text-lg italic">Адмін</span>
            <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Сайт
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
