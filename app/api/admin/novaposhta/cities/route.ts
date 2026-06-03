import { NextResponse } from "next/server"
import { requireAdminOr401 } from "@/lib/admin-api"
import { searchCities } from "@/lib/novaposhta"

export async function GET(req: Request) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const url = new URL(req.url)
  const search = url.searchParams.get("search")?.trim() ?? ""

  if (!search || search.length < 2) {
    return NextResponse.json([])
  }

  try {
    const cities = await searchCities(search)
    return NextResponse.json(
      cities.map((c) => ({ name: c.Description, ref: c.Ref }))
    )
  } catch (error) {
    console.error("NP_CITIES_ERROR:", error)
    return NextResponse.json(
      { error: "Не вдалося знайти міста" },
      { status: 500 }
    )
  }
}
