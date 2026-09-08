import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AssetSchema } from "@/lib/validations"
import { addMoney, calculatePercentage } from "@/lib/decimal"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const assets = await db.asset.findMany({
      where: { userId },
      orderBy: [{ category: "asc" }, { value: "desc" }],
    })

    // If no assets exist yet, seed initial assets based on accounts (e.g. Cash Wallet, Main Checking) so the user has immediate data
    if (assets.length === 0) {
      const accounts = await db.account.findMany({ where: { userId } })
      const txs = await db.transaction.findMany({
        where: { userId },
        select: { accountId: true, type: true, amount: true },
      })

      // Calculate balance per account
      for (const acc of accounts) {
        const accTxs = txs.filter((t) => t.accountId === acc.id)
        const net = accTxs.reduce(
          (sum, t) => (t.type === "INCOME" ? addMoney(sum, t.amount) : sum - t.amount),
          acc.openingBalance
        )
        const isCash = acc.type === "CASH"
        await db.asset.create({
          data: {
            userId,
            name: acc.name,
            category: isCash ? "CASH" : "BANK",
            value: Math.max(0, net),
            notes: "Linked to " + acc.name,
          },
        })
      }

      // Re-fetch after default sync
      const seededAssets = await db.asset.findMany({
        where: { userId },
        orderBy: [{ category: "asc" }, { value: "desc" }],
      })

      return buildResponse(seededAssets)
    }

    return buildResponse(assets)
  } catch (error) {
    console.error("Assets GET error:", error)
    return NextResponse.json({ message: "Failed to fetch assets" }, { status: 500 })
  }
}

function buildResponse(assets: any[]) {
  let totalNetWorth = 0
  let cashTotal = 0
  let bankTotal = 0
  let goldTotal = 0
  let silverTotal = 0
  let cryptoTotal = 0
  let otherTotal = 0

  for (const asset of assets) {
    totalNetWorth = addMoney(totalNetWorth, asset.value)
    switch (asset.category) {
      case "CASH":
        cashTotal = addMoney(cashTotal, asset.value)
        break
      case "BANK":
        bankTotal = addMoney(bankTotal, asset.value)
        break
      case "GOLD":
        goldTotal = addMoney(goldTotal, asset.value)
        break
      case "SILVER":
        silverTotal = addMoney(silverTotal, asset.value)
        break
      case "CRYPTO":
        cryptoTotal = addMoney(cryptoTotal, asset.value)
        break
      default:
        otherTotal = addMoney(otherTotal, asset.value)
        break
    }
  }

  const categoryBreakdown = [
    { category: "CASH", label: "Cash & Liquid", total: cashTotal, percent: calculatePercentage(cashTotal, totalNetWorth) },
    { category: "BANK", label: "Bank Accounts", total: bankTotal, percent: calculatePercentage(bankTotal, totalNetWorth) },
    { category: "GOLD", label: "Physical Gold", total: goldTotal, percent: calculatePercentage(goldTotal, totalNetWorth) },
    { category: "SILVER", label: "Physical Silver", total: silverTotal, percent: calculatePercentage(silverTotal, totalNetWorth) },
    { category: "CRYPTO", label: "Crypto Assets", total: cryptoTotal, percent: calculatePercentage(cryptoTotal, totalNetWorth) },
    { category: "OTHER", label: "Other Assets", total: otherTotal, percent: calculatePercentage(otherTotal, totalNetWorth) },
  ].filter((item) => item.total > 0)

  return NextResponse.json({
    assets,
    summary: {
      totalNetWorth,
      cashTotal,
      bankTotal,
      goldTotal,
      silverTotal,
      cryptoTotal,
      otherTotal,
      assetCount: assets.length,
      categoryBreakdown,
    },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await req.json()
    const validated = AssetSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid asset data", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const asset = await db.asset.create({
      data: {
        userId,
        name: validated.data.name,
        category: validated.data.category,
        value: validated.data.value,
        quantity: validated.data.quantity ?? null,
        unit: validated.data.unit ?? null,
        notes: validated.data.notes ?? null,
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error("Asset POST error:", error)
    return NextResponse.json({ message: "Failed to create asset" }, { status: 500 })
  }
}
