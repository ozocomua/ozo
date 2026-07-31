import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request) {
  const body = await req.json()
  const { accountSize, dailyLossLimit, totalLossLimit, profitTarget, currentBalance, phase } = body

  let config = await prisma.ftmoConfig.findFirst()
  if (config) {
    config = await prisma.ftmoConfig.update({
      where: { id: config.id },
      data: {
        accountSize: accountSize !== undefined ? Number(accountSize) : undefined,
        dailyLossLimit: dailyLossLimit !== undefined ? Number(dailyLossLimit) : undefined,
        totalLossLimit: totalLossLimit !== undefined ? Number(totalLossLimit) : undefined,
        profitTarget: profitTarget !== undefined ? Number(profitTarget) : undefined,
        currentBalance: currentBalance !== undefined ? Number(currentBalance) : undefined,
        phase: phase || undefined,
      },
    })
  } else {
    config = await prisma.ftmoConfig.create({
      data: {
        accountSize: accountSize ? Number(accountSize) : 100000,
        dailyLossLimit: dailyLossLimit ? Number(dailyLossLimit) : 5,
        totalLossLimit: totalLossLimit ? Number(totalLossLimit) : 10,
        profitTarget: profitTarget ? Number(profitTarget) : 10,
        currentBalance: currentBalance ? Number(currentBalance) : 100000,
        phase: phase || "Challenge",
      },
    })
  }

  return NextResponse.json({ success: true, config })
}
