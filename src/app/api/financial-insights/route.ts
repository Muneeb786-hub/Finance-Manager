import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { addMoney, subtractMoney, calculatePercentage, getBudgetStatus } from "@/lib/decimal"
import {
  calculateMonthOverMonthVariances,
  calculate503020Benchmark,
  evaluateFinancialHealthScore,
  generateInsightObservations,
  CategorySummary,
} from "@/lib/insights"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const yearParam = searchParams.get("year")
    const monthParam = searchParams.get("month")

    const currentYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear()
    const currentMonth = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1

    // Date ranges for current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)

    // Date ranges for previous month
    const prevDate = new Date(currentYear, currentMonth - 2, 1)
    const startOfPrevMonth = new Date(prevDate.getFullYear(), prevDate.getMonth(), 1)
    const endOfPrevMonth = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0, 23, 59, 59, 999)

    // 1. Fetch user accounts and total balance
    const accounts = await db.account.findMany({ where: { userId } })
    const allTransactions = await db.transaction.findMany({
      where: { userId },
      select: { type: true, amount: true },
    })
    const initialOpening = accounts.reduce((acc, a) => addMoney(acc, a.openingBalance), 0)
    const netAllTx = allTransactions.reduce((acc, t) => {
      return t.type === "INCOME" ? addMoney(acc, t.amount) : subtractMoney(acc, t.amount)
    }, 0)
    const totalLiquidBalance = Math.max(0, addMoney(initialOpening, netAllTx))

    // 2. Fetch current and previous month transactions
    const [currentTx, prevTx] = await Promise.all([
      db.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { category: true },
      }),
      db.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        },
        include: { category: true },
      }),
    ])

    // Current month totals & category aggregation
    let monthlyIncome = 0
    let monthlyExpenses = 0
    const currentCategoryMap: Record<string, CategorySummary> = {}

    // Track Needs vs Wants based on common categories or default classification
    let needsSpending = 0
    let wantsSpending = 0

    const needsKeywords = ["rent", "housing", "groceries", "utility", "utilities", "bills", "healthcare", "medical", "transit", "transport", "fuel", "insurance"]

    for (const t of currentTx) {
      if (t.type === "INCOME") {
        monthlyIncome = addMoney(monthlyIncome, t.amount)
      } else {
        monthlyExpenses = addMoney(monthlyExpenses, t.amount)
        const catId = t.categoryId
        const catName = t.category?.name || "Other"
        const catColor = t.category?.color || "#10b981"

        if (!currentCategoryMap[catId]) {
          currentCategoryMap[catId] = { categoryId: catId, name: catName, color: catColor, amount: 0 }
        }
        currentCategoryMap[catId].amount = addMoney(currentCategoryMap[catId].amount, t.amount)

        const isNeed = needsKeywords.some((k) => catName.toLowerCase().includes(k))
        if (isNeed) {
          needsSpending = addMoney(needsSpending, t.amount)
        } else {
          wantsSpending = addMoney(wantsSpending, t.amount)
        }
      }
    }

    // Previous month category aggregation
    let prevExpenses = 0
    const prevCategoryMap: Record<string, CategorySummary> = {}
    for (const t of prevTx) {
      if (t.type === "EXPENSE") {
        prevExpenses = addMoney(prevExpenses, t.amount)
        const catId = t.categoryId
        const catName = t.category?.name || "Other"
        const catColor = t.category?.color || "#10b981"

        if (!prevCategoryMap[catId]) {
          prevCategoryMap[catId] = { categoryId: catId, name: catName, color: catColor, amount: 0 }
        }
        prevCategoryMap[catId].amount = addMoney(prevCategoryMap[catId].amount, t.amount)
      }
    }

    const currentExpensesList = Object.values(currentCategoryMap)
    const prevExpensesList = Object.values(prevCategoryMap)

    // Calculate month-over-month shifts
    const momVariances = calculateMonthOverMonthVariances(currentExpensesList, prevExpensesList)
    const significantSpikes = momVariances.filter((v) => v.trend === "INCREASED" && v.difference >= 50 && v.percentageChange >= 20)

    // Top spending category
    const sortedCategories = [...currentExpensesList].sort((a, b) => b.amount - a.amount)
    const topCategory = sortedCategories[0]
      ? {
          name: sortedCategories[0].name,
          amount: sortedCategories[0].amount,
          percentage: monthlyExpenses > 0 ? calculatePercentage(sortedCategories[0].amount, monthlyExpenses) : 0,
        }
      : undefined

    // 3. Fetch Budgets
    const budgetsData = await db.budget.findMany({
      where: { userId, month: currentMonth, year: currentYear },
      include: { category: true },
    })

    const overBudgets: { name: string; spent: number; amount: number; overAmount: number }[] = []
    const nearBudgets: { name: string; spent: number; amount: number; percent: number }[] = []
    const budgetedCatIds = new Set<string>()

    for (const b of budgetsData) {
      budgetedCatIds.add(b.categoryId)
      const spent = currentCategoryMap[b.categoryId]?.amount || 0
      const status = getBudgetStatus(spent, b.amount, b.alertThreshold)
      const percent = calculatePercentage(spent, b.amount)

      if (status === "OVER_BUDGET") {
        overBudgets.push({
          name: b.category.name,
          spent,
          amount: b.amount,
          overAmount: Math.max(0, subtractMoney(spent, b.amount)),
        })
      } else if (status === "APPROACHING") {
        nearBudgets.push({
          name: b.category.name,
          spent,
          amount: b.amount,
          percent,
        })
      }
    }

    const unbudgetedCategories = currentExpensesList
      .filter((c) => !budgetedCatIds.has(c.categoryId) && c.amount > 0)
      .map((c) => ({ name: c.name, spent: c.amount }))

    // 4. Fetch Goals and Recurring transactions
    const [goals, recurringList] = await Promise.all([
      db.savingsGoal.findMany({ where: { userId } }),
      db.recurringTransaction.findMany({ where: { userId, isActive: true } }),
    ])

    const activeGoalsCount = goals.filter((g) => g.status === "ACTIVE").length
    const completedGoalsCount = goals.filter((g) => g.status === "COMPLETED").length

    // Monthly recurring costs calculation
    let monthlyRecurringExpenses = 0
    for (const r of recurringList) {
      if (r.type === "EXPENSE") {
        if (r.frequency === "DAILY") monthlyRecurringExpenses = addMoney(monthlyRecurringExpenses, r.amount * 30)
        else if (r.frequency === "WEEKLY") monthlyRecurringExpenses = addMoney(monthlyRecurringExpenses, r.amount * 4.33)
        else if (r.frequency === "MONTHLY") monthlyRecurringExpenses = addMoney(monthlyRecurringExpenses, r.amount)
        else if (r.frequency === "YEARLY") monthlyRecurringExpenses = addMoney(monthlyRecurringExpenses, r.amount / 12)
      }
    }

    const netFlow = subtractMoney(monthlyIncome, monthlyExpenses)
    const netSavings = Math.max(0, netFlow)

    // 5. Evaluate Financial Health Score
    const healthScore = evaluateFinancialHealthScore({
      monthlyIncome,
      monthlyExpenses,
      totalLiquidBalance,
      overBudgetCount: overBudgets.length,
      totalBudgetsCount: budgetsData.length,
      monthlyRecurringExpenses,
    })

    // 6. 50/30/20 Benchmark
    const benchmark503020 = calculate503020Benchmark(monthlyIncome, needsSpending, wantsSpending, netSavings)

    // 7. Actionable observations
    const observations = generateInsightObservations({
      monthlyIncome,
      monthlyExpenses,
      netFlow,
      savingsRate: healthScore.savingsRate,
      overBudgets,
      nearBudgets,
      unbudgetedCategories,
      topSpendingCategory: topCategory,
      significantSpikes,
      activeGoalsCount,
      completedGoalsCount,
      recurringMonthlyTotal: monthlyRecurringExpenses,
      recurringCount: recurringList.length,
    })

    // 8. Historical saved snapshots
    const savedSnapshots = await db.financialInsight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({
      period: {
        month: currentMonth,
        year: currentYear,
        monthName: startOfMonth.toLocaleString("default", { month: "long" }),
      },
      metrics: {
        monthlyIncome,
        monthlyExpenses,
        netFlow,
        totalLiquidBalance,
        monthlyRecurringExpenses,
      },
      healthScore,
      benchmark503020,
      momVariances,
      observations,
      savedSnapshots,
    })
  } catch (error) {
    console.error("Financial Insights GET error:", error)
    return NextResponse.json({ message: "Failed to generate financial insights" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await request.json().catch(() => ({}))
    const now = new Date()
    const year = body.year ? parseInt(body.year, 10) : now.getFullYear()
    const month = body.month ? parseInt(body.month, 10) : now.getMonth() + 1

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

    // Fetch month's transactions and accounts
    const [transactions, accounts, budgets, goals, recurring] = await Promise.all([
      db.transaction.findMany({
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
        include: { category: true },
      }),
      db.account.findMany({ where: { userId } }),
      db.budget.findMany({ where: { userId, month, year }, include: { category: true } }),
      db.savingsGoal.findMany({ where: { userId } }),
      db.recurringTransaction.findMany({ where: { userId, isActive: true } }),
    ])

    let income = 0
    let expenses = 0
    const catMap: Record<string, CategorySummary> = {}

    for (const t of transactions) {
      if (t.type === "INCOME") income = addMoney(income, t.amount)
      else {
        expenses = addMoney(expenses, t.amount)
        const id = t.categoryId
        const name = t.category?.name || "Other"
        const color = t.category?.color || "#10b981"
        if (!catMap[id]) catMap[id] = { categoryId: id, name, color, amount: 0 }
        catMap[id].amount = addMoney(catMap[id].amount, t.amount)
      }
    }

    const netFlow = subtractMoney(income, expenses)
    const totalLiquid = accounts.reduce((sum, a) => addMoney(sum, a.openingBalance), 0)

    let recurringTotal = 0
    for (const r of recurring) {
      if (r.type === "EXPENSE") {
        if (r.frequency === "DAILY") recurringTotal = addMoney(recurringTotal, r.amount * 30)
        else if (r.frequency === "WEEKLY") recurringTotal = addMoney(recurringTotal, r.amount * 4.33)
        else if (r.frequency === "MONTHLY") recurringTotal = addMoney(recurringTotal, r.amount)
        else if (r.frequency === "YEARLY") recurringTotal = addMoney(recurringTotal, r.amount / 12)
      }
    }

    let overBudgetCount = 0
    for (const b of budgets) {
      const spent = catMap[b.categoryId]?.amount || 0
      if (getBudgetStatus(spent, b.amount, b.alertThreshold) === "OVER_BUDGET") {
        overBudgetCount++
      }
    }

    const health = evaluateFinancialHealthScore({
      monthlyIncome: income,
      monthlyExpenses: expenses,
      totalLiquidBalance: totalLiquid,
      overBudgetCount,
      totalBudgetsCount: budgets.length,
      monthlyRecurringExpenses: recurringTotal,
    })

    const summaryText = `${startOfMonth.toLocaleString("default", { month: "long" })} ${year} Financial Health: ${health.rating} (${health.score}/100). Net flow: $${netFlow.toFixed(2)} with a ${health.savingsRate}% savings rate.`

    const structuredSnapshot = {
      income,
      expenses,
      netFlow,
      healthScore: health,
      topCategories: Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 5),
      budgetsCount: budgets.length,
      overBudgetCount,
      activeGoalsCount: goals.filter((g) => g.status === "ACTIVE").length,
    }

    const saved = await db.financialInsight.create({
      data: {
        userId,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        summary: summaryText,
        structuredData: structuredSnapshot as any,
      },
    })

    return NextResponse.json(saved, { status: 201 })
  } catch (error) {
    console.error("Financial Insights POST error:", error)
    return NextResponse.json({ message: "Failed to create insight snapshot" }, { status: 500 })
  }
}
