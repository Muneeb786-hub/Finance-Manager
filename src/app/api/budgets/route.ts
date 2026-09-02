import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { BudgetSchema } from "@/lib/validations"
import { addMoney, subtractMoney, calculatePercentage, getBudgetStatus } from "@/lib/decimal"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)

  const now = new Date()
  const month = parseInt(searchParams.get("month") || (now.getMonth() + 1).toString(), 10)
  const year = parseInt(searchParams.get("year") || now.getFullYear().toString(), 10)

  try {
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

    // 1. Fetch user budgets for the requested month & year
    const budgets = await db.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
      orderBy: { amount: "desc" },
    })

    // 2. Fetch all expense transactions in this month
    const monthExpenses = await db.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true },
    })

    // 3. Aggregate spending by category
    const categorySpendingMap: Record<string, { total: number; name: string; color: string; icon: string }> = {}
    for (const t of monthExpenses) {
      if (!categorySpendingMap[t.categoryId]) {
        categorySpendingMap[t.categoryId] = {
          total: 0,
          name: t.category?.name || "Other",
          color: t.category?.color || "#10b981",
          icon: t.category?.icon || "tag",
        }
      }
      categorySpendingMap[t.categoryId].total = addMoney(
        categorySpendingMap[t.categoryId].total,
        t.amount
      )
    }

    // 4. Map budgets with live consumption metrics
    const budgetedCategoryIds = new Set<string>()
    let totalBudgeted = 0
    let totalSpent = 0
    let onTrackCount = 0
    let approachingCount = 0
    let overBudgetCount = 0

    const enrichedBudgets = budgets.map((b) => {
      budgetedCategoryIds.add(b.categoryId)
      const spent = categorySpendingMap[b.categoryId]?.total || 0
      const percent = calculatePercentage(spent, b.amount)
      const status = getBudgetStatus(spent, b.amount, b.alertThreshold)
      const remaining = Math.max(0, subtractMoney(b.amount, spent))

      totalBudgeted = addMoney(totalBudgeted, b.amount)
      totalSpent = addMoney(totalSpent, spent)

      if (status === "OVER_BUDGET") overBudgetCount++
      else if (status === "APPROACHING") approachingCount++
      else onTrackCount++

      return {
        id: b.id,
        categoryId: b.categoryId,
        category: b.category,
        amount: b.amount,
        month: b.month,
        year: b.year,
        alertThreshold: b.alertThreshold,
        spent,
        remaining,
        percent,
        status,
      }
    })

    // 5. Check for unbudgeted categories that had spending this month
    const unbudgetedCategories: { categoryId: string; name: string; color: string; icon: string; spent: number }[] = []
    for (const [catId, data] of Object.entries(categorySpendingMap)) {
      if (!budgetedCategoryIds.has(catId)) {
        unbudgetedCategories.push({
          categoryId: catId,
          name: data.name,
          color: data.color,
          icon: data.icon,
          spent: data.total,
        })
      }
    }

    const totalRemaining = Math.max(0, subtractMoney(totalBudgeted, totalSpent))
    const overallPercent = totalBudgeted > 0 ? calculatePercentage(totalSpent, totalBudgeted) : 0

    return NextResponse.json({
      month,
      year,
      budgets: enrichedBudgets,
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining,
        overallPercent,
        budgetCount: enrichedBudgets.length,
        onTrackCount,
        approachingCount,
        overBudgetCount,
      },
      unbudgetedCategories,
    })
  } catch (error) {
    console.error("Failed to load budgets:", error)
    return NextResponse.json({ message: "Failed to load budgets" }, { status: 500 })
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
    const validation = BudgetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { categoryId, amount, month, year, alertThreshold } = validation.data

    // Verify category belongs to user or is default
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId }, { isDefault: true }],
      },
    })

    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 })
    }

    const budget = await db.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month,
          year,
        },
      },
      create: {
        userId,
        categoryId,
        amount,
        month,
        year,
        alertThreshold,
      },
      update: {
        amount,
        alertThreshold,
      },
      include: { category: true },
    })

    return NextResponse.json(budget, { status: 201 })
  } catch (error) {
    console.error("Failed to save budget:", error)
    return NextResponse.json({ message: "Failed to save budget" }, { status: 500 })
  }
}
