import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: Promise<{ phone: string }> }) {
  const { phone } = await params
  return NextResponse.redirect(`viber://chat?number=%2B${phone}`)
}
