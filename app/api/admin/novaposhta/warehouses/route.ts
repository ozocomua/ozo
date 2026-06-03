import { NextResponse } from "next/server"
import { requireAdminOr401 } from "@/lib/admin-api"
import { searchWarehouses } from "@/lib/novaposhta"

export async function GET(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const url = new URL(req.url)
  const cityRef = url.searchParams.get("cityRef")?.trim() ?? ""

  if (!cityRef) {
    return NextResponse.json([])
  }

  try {
    const warehouses = await searchWarehouses(cityRef)
    return NextResponse.json(
      warehouses.map((w) => ({ name: w.Description, ref: w.Ref }))
    )
  } catch (error) {
    console.error("NP_WAREHOUSES_ERROR:", error)
    return NextResponse.json(
      { error: "Не вдалося знайти відділення" },
      { status: 500 }
    )
  }
}
