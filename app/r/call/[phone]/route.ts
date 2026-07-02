import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ phone: string }> }) {
  const { phone } = await params
  const cleaned = phone.replace(/\D/g, "")
  const intl = cleaned.startsWith("38") ? `+${cleaned}` : `+38${cleaned.startsWith("0") ? cleaned.slice(1) : cleaned}`
  return NextResponse.redirect(`tel:${intl}`)
}
