import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminOr401 } from "@/lib/admin-api"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const callbackId = Number(id)
  if (!Number.isFinite(callbackId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const status =
    typeof body === "object" && body !== null && "status" in body
      ? (body as { status?: unknown }).status
      : null

  if (typeof status !== "string" || !status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 })
  }

  try {
    await prisma.callbackRequest.update({
      where: { id: callbackId },
      data: { status },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("CALLBACK_UPDATE_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося оновити статус" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminOr401()
  if (guard) return guard

  const { id } = await params
  const callbackId = Number(id)
  if (!Number.isFinite(callbackId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  try {
    await prisma.callbackRequest.delete({ where: { id: callbackId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("CALLBACK_DELETE_ERROR:", error)
    return NextResponse.json({ error: "Не вдалося видалити заявку" }, { status: 500 })
  }
}
