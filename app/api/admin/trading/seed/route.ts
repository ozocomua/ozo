import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALL_PAIRS = [
  "EURUSD","GBPUSD","USDCHF","USDJPY","USDCAD","AUDUSD","AUDNZD","AUDCAD","AUDCHF","AUDJPY",
  "CHFJPY","EURGBP","EURAUD","EURCHF","EURJPY","EURNZD","EURCAD","GBPCHF","GBPJPY","CADCHF",
  "CADJPY","GBPAUD","GBPCAD","GBPNZD","NZDCAD","NZDCHF","NZDJPY","NZDUSD",
  "GER40.cash","UK100.cash","US100.cash","US30.cash","US500.cash",
  "AUS200.cash","EU50.cash","FRA40.cash","HK50.cash","JP225.cash","N25.cash","SPN35.cash","US2000.cash","UKOIL.cash","USOIL.cash",
  "XAUUSD","XAUAUD","XAUEUR","XAGAUD","XAGEUR","XAGUSD","XPDUSD","XPTUSD","XCUUSD",
  "EURCZK","EURHUF","EURNOK","EURPLN","USDCZK","USDHKD","USDHUF","USDILS","USDMXN","USDNOK","USDPLN","USDSEK","USDZAR","USDSGD","USDCNH",
  "AAPL","AMZN","BABA","BAC","GOOG","MSFT","NFLX","NVDA","PFE","RACE","T","TSLA","V","WMT","ZM",
  "META","GE","BA","RTX","LMT","PLTR","AMD","INTC","QCOM","AVGO","CSCO","JNJ","MCD","SBUX","KO",
  "MSTR","GME","NKE","CVX","FDX","JPM","DIS","GM","IBM","ARM","SNOW","ASML","AZN","BRK.B","XOM","SPCX",
  "AIRF","ALVG","BAYGn","DBKGn","IBE","LVMH","VOWG_p","TTE","SAN","ADSGn","BMW","MBG","SIEGn",
  "COCOA.c","COFFEE.c","CORN.c","SOYBEAN.c","WHEAT.c","COTTON.c","SUGAR.c",
  "NATGAS.cash","HEATOIL.c","DXY.cash",
  "ADAUSD","BTCUSD","DASHUSD","DOTUSD","ETHUSD","LTCUSD","XRPUSD","BCHUSD","SOLUSD","AVAUSD","ETCUSD",
  "DOGEUSD","NEOUSD","XMRUSD","BNBUSD","SANUSD","LNKUSD","NERUSD","ALGUSD","ICPUSD","AAVUSD",
  "BARUSD","GALUSD","GRTUSD","IMXUSD","MANUSD","VECUSD","XLMUSD","UNIUSD","FETUSD","XTZUSD",
]

export async function POST() {
  let created = 0
  let skipped = 0

  for (const symbol of ALL_PAIRS) {
    const existing = await prisma.tradingPair.findUnique({ where: { symbol } })
    if (existing) { skipped++; continue }
    await prisma.tradingPair.create({ data: { symbol } })
    created++
  }

  return NextResponse.json({ success: true, created, skipped, total: ALL_PAIRS.length })
}
