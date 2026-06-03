import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-foreground text-background flex flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6 max-w-md">
        <p className="text-xs tracking-[0.3em] text-background/40 uppercase">
          Помилка 404
        </p>
        <h1 className="font-serif text-6xl md:text-8xl font-bold tracking-tight leading-none">
          404
        </h1>
        <p className="text-sm md:text-base text-background/60 leading-relaxed">
          На жаль, сторінку, яку ви шукаєте, не знайдено.
          <br />
          Можливо, вона була переміщена або видалена.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-background text-foreground text-sm font-medium px-8 py-3.5 rounded-xl hover:bg-background/90 transition-colors"
        >
          Повернутись на головну
        </Link>
      </div>
    </div>
  )
}
