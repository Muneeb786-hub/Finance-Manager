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

    let totalNetWorth = 0
    const categoryMap: Record<string, { category: string; total: number; count: number }> = {}

    for (const asset of assets) {
      totalNetWorth = addMoney(totalNetWorth, asset.value)
      const cat = asset.category?.trim() || "Other"
      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, total: 0, count: 0 }
      }
      categoryMap[cat].total = addMoney(categoryMap[cat].total, asset.value)
      categoryMap[cat].count++
    }

    const categoryBreakdown = Object.values(categoryMap)
      .map((item) => ({
        category: item.category,
        total: item.total,
        count: item.count,
        percent: calculatePercentage(item.total, totalNetWorth),
      }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({
      assets,
      summary: {
        totalNetWorth,
        assetCount: assets.length,
        categoryBreakdown,
      },
    })
  } catch (error) {
    console.error("Assets GET error:", error)
    return NextResponse.json({ message: "Failed to fetch assets" }, { status: 500 })
  }
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
        name: validated.data.name.trim(),
        category: validated.data.category.trim(),
        value: validated.data.value,
        quantity: validated.data.quantity ?? null,
        unit: validated.data.unit ? validated.data.unit.trim() : null,
        notes: validated.data.notes ? validated.data.notes.trim() : null,
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error("Asset POST error:", error)
    return NextResponse.json({ message: "Failed to create asset" }, { status: 500 })
  }
}
