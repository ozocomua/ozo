import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"
import { deleteUploadsByUrls } from "@/lib/upload-cleanup"

export async function POST(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const rawIds =
    body && typeof body === "object" && Array.isArray((body as { ids?: unknown }).ids)
      ? ((body as { ids: unknown[] }).ids as unknown[])
      : null

  const ids = rawIds
    ? (rawIds.map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0) as number[])
    : null

  if (!ids || !ids.length) {
    return NextResponse.json({ error: "No ids" }, { status: 400 })
  }

  try {
    // Збираємо URL фото, щоб видалити файли з диска
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { images: { select: { url: true } } },
    })
    const urls = products.flatMap((p) => p.images.map((i) => i.url))
    if (urls.length) {
      await deleteUploadsByUrls(urls)
    }

    const result = await prisma.product.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ success: true, count: result.count })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Помилка"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
