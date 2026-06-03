import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function GET(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const url = new URL(req.url)
  const statusRaw = url.searchParams.get("status")?.trim() ?? ""

  try {
    const where: Record<string, unknown> = {}
    if (statusRaw) {
      where.status = statusRaw
    }

    const callbacks = await prisma.callbackRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({ callbacks })
  } catch (error) {
    console.error("CALLBACKS_FETCH_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося завантажити заявки" }, { status: 500 })
  }
}
