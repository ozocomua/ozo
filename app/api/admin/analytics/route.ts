import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies, headers } from "next/headers"
import { ADMIN_ENTRY_HEADER, ADMIN_SESSION_COOKIE, adminEntrySecretValue, verifyAdminSessionCookie } from "@/lib/admin-auth"

export async function GET(_req: Request) {
  // ---- Admin gate ----
  const h = await headers()
  const expected = adminEntrySecretValue()
  const got = h.get(ADMIN_ENTRY_HEADER)
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const sessionValid = verifyAdminSessionCookie(sessionCookie)
  if (!(expected && got === expected) && !sessionValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(_req.url)
  const fromParam = url.searchParams.get("from")
  const toParam = url.searchParams.get("to")

  const now = new Date()
  let startDate: Date
  let endDate: Date
  let month: number
  let year: number

  if (fromParam && toParam) {
    startDate = new Date(fromParam + "T00:00:00")
    endDate = new Date(toParam + "T23:59:59")
    month = startDate.getMonth()
    year = startDate.getFullYear()
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      month = now.getMonth()
      year = now.getFullYear()
    }
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    month = now.getMonth()
    year = now.getFullYear()
  }

  // ---- 1. Profit by day (all orders in range, excluding refused) ----
  const monthOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: "Відмова" },
    },
    select: { total: true, createdAt: true, orderItems: true },
    orderBy: { createdAt: "asc" },
  })

  const profitByDayMap = new Map<string, number>()
  for (const o of monthOrders) {
    const day = o.createdAt.toISOString().slice(0, 10) // YYYY-MM-DD
    profitByDayMap.set(day, (profitByDayMap.get(day) || 0) + o.total)
  }

  const profitByDay = Array.from(profitByDayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))

  // Fill gaps with zeros for days without orders
  const allDays: { date: string; total: number }[] = []
  const d = new Date(startDate)
  const end = new Date(endDate)
  const label = now > end ? end : now
  while (d <= label) {
    const key = d.toISOString().slice(0, 10)
    allDays.push({ date: key, total: profitByDayMap.get(key) || 0 })
    d.setDate(d.getDate() + 1)
  }

  // ---- 2. Sales by category (current month) ----
  // Collect all product IDs from orderItems JSON
  const productIdsFromOrders = new Set<number>()
  for (const o of monthOrders) {
    const items = o.orderItems as any
    if (Array.isArray(items)) {
      for (const item of items) {
        const pid = Number(item?.productId)
        if (Number.isFinite(pid) && pid > 0) productIdsFromOrders.add(pid)
      }
    }
  }

  let categories: { name: string; total: number }[] = []

  if (productIdsFromOrders.size > 0) {
    // Get products with their categories
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(productIdsFromOrders) } },
      select: {
        id: true,
        categories: {
          select: { category: { select: { name: true } } },
          take: 1,
        },
      },
    })

    const productCategoryMap = new Map<number, string>()
    for (const p of products) {
      const catName = p.categories[0]?.category?.name || "Без категорії"
      productCategoryMap.set(p.id, catName)
    }

    // Now sum totals by category from orders
    const categoryTotals = new Map<string, number>()
    for (const o of monthOrders) {
      const items = o.orderItems as any
      if (!Array.isArray(items)) continue
      for (const item of items) {
        const pid = Number(item?.productId)
        if (!Number.isFinite(pid) || pid < 1) continue
        const cat = productCategoryMap.get(pid) || "Без категорії"
        const qty = Number(item?.quantity) || 1
        // Approximate: distribute order total proportionally by items count
        const itemShare = o.total / items.length
        categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + itemShare)
      }
    }

    categories = Array.from(categoryTotals.entries())
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
  }

  // ---- 3. Summary stats ----
  const totalRevenue = Math.round(monthOrders.reduce((s, o) => s + o.total, 0) * 100) / 100
  const orderCount = monthOrders.length

  return NextResponse.json({
    profitByDay: allDays,
    categories,
    totalRevenue,
    orderCount,
    month,
    year,
    dateFrom: startDate.toISOString().slice(0, 10),
    dateTo: endDate.toISOString().slice(0, 10),
  })
}
