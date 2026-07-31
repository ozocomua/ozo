import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const GROUPS: Record<string, string[]> = {
  Forex: [
    "EURUSD","GBPUSD","USDCHF","USDJPY","USDCAD","AUDUSD","AUDNZD","AUDCAD","AUDCHF","AUDJPY",
    "CHFJPY","EURGBP","EURAUD","EURCHF","EURJPY","EURNZD","EURCAD","GBPCHF","GBPJPY","CADCHF",
    "CADJPY","GBPAUD","GBPCAD","GBPNZD","NZDCAD","NZDCHF","NZDJPY","NZDUSD",
  ],
  "Cash CFD": [
    "GER40.cash","UK100.cash","US100.cash","US30.cash","US500.cash",
  ],
  "Cash II CFD": [
    "AUS200.cash","EU50.cash","FRA40.cash","HK50.cash","JP225.cash","N25.cash","SPN35.cash","US2000.cash","UKOIL.cash","USOIL.cash",
  ],
  "Metals CFD": [
    "XAUUSD","XAUAUD","XAUEUR","XAGAUD","XAGEUR","XAGUSD","XPDUSD","XPTUSD","XCUUSD",
  ],
  "Crypto CFD": [] as string[],
  Exotics: [
    "EURCZK","EURHUF","EURNOK","EURPLN","USDCZK","USDHKD","USDHUF","USDILS","USDMXN","USDNOK","USDPLN","USDSEK","USDZAR","USDSGD","USDCNH",
  ],
  "Equities I CFD": [
    "AAPL","AMZN","BABA","BAC","GOOG","MSFT","NFLX","NVDA","PFE","RACE","T","TSLA","V","WMT","ZM",
    "META","GE","BA","RTX","LMT","PLTR","AMD","INTC","QCOM","AVGO","CSCO","JNJ","MCD","SBUX","KO",
    "MSTR","GME","NKE","CVX","FDX","JPM","DIS","GM","IBM","ARM","SNOW","ASML","AZN","BRK.B","XOM","SPCX",
  ],
  "Equities II CFD": [
    "AIRF","ALVG","BAYGn","DBKGn","IBE","LVMH","VOWG_p","TTE","SAN","ADSGn","BMW","MBG","SIEGn",
  ],
  Agriculture: [
    "COCOA.c","COFFEE.c","CORN.c","SOYBEAN.c","WHEAT.c","COTTON.c","SUGAR.c",
  ],
  Commodities: [
    "NATGAS.cash","HEATOIL.c",
  ],
  "Cash III CFD": [
    "DXY.cash",
  ],
  "Crypto I CFD": [
    "ADAUSD","BTCUSD","DASHUSD","DOTUSD","ETHUSD","LTCUSD","XRPUSD","BCHUSD","SOLUSD","AVAUSD","ETCUSD",
  ],
  "Crypto II CFD": [
    "DOGEUSD","NEOUSD","XMRUSD","BNBUSD","SANUSD","LNKUSD","NERUSD","ALGUSD","ICPUSD","AAVUSD",
    "BARUSD","GALUSD","GRTUSD","IMXUSD","MANUSD","VECUSD","XLMUSD","UNIUSD","FETUSD","XTZUSD",
  ],
}

export async function POST() {
  let created = 0
  let skipped = 0

  for (const [group, symbols] of Object.entries(GROUPS)) {
    for (const symbol of symbols) {
      const existing = await prisma.tradingPair.findUnique({ where: { symbol } })
      if (existing) {
        // Update group if missing
        if (!existing.groupName) {
          await prisma.tradingPair.update({ where: { symbol }, data: { groupName: group } })
        }
        skipped++
        continue
      }
      await prisma.tradingPair.create({ data: { symbol, groupName: group } })
      created++
    }
  }

  return NextResponse.json({ success: true, created, skipped })
}
