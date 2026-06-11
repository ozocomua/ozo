"use client"

import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6 max-w-md">
        <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
          Помилка сервера
        </p>
        <h1 className="font-serif text-6xl md:text-8xl font-bold tracking-tight leading-none text-foreground">
          Oй!
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          Сталася непередбачувана помилка. Спробуйте оновити сторінку або повернутись на головну.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white text-sm font-medium px-8 py-3.5 rounded-xl hover:from-[#0c5db8] hover:to-[#00c5e3] transition-colors"
          >
            Спробувати знову
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-border text-foreground text-sm font-medium px-8 py-3.5 rounded-xl hover:bg-muted transition-colors"
          >
            На головну
          </Link>
        </div>
      </div>
    </div>
  )
}
