import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"
import { normalizeOrderStatus } from "@/lib/order-status"

export async function GET(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const url = new URL(req.url)
  const statusRaw = url.searchParams.get("status")
  const tagsRaw = url.searchParams.get("tags")?.trim() ?? ""
  const q = url.searchParams.get("q")?.trim() ?? ""

  const status = statusRaw && statusRaw !== "ALL" ? normalizeOrderStatus(statusRaw) : null
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10)
    : []

  try {
    const where: any = {}

    if (status) {
      if (status === "NEW") {
        where.status = { in: ["NEW", "Нове", "Новий", "Новый"] }
      } else {
        where.status = status
      }
    }

    if (q) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { orderNumber: { contains: q } },
            { user: { phone: { contains: q } } },
          ],
        },
      ]
    }

    if (tags.length) {
      where.tags = { some: { name: { in: tags } } }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { phone: true, name: true } },
        tags: { select: { name: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("ORDERS_FETCH_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося завантажити замовлення." }, { status: 500 })
  }
}
