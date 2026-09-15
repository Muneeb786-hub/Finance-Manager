import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { addMoney, subtractMoney, calculatePercentage, getBudgetStatus } from "@/lib/decimal"
import { getZonedMonthRange, getZonedYearMonth } from "@/lib/dates"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const now = new Date()
    const profile = await db.user.findUnique({
      where: { id: userId },
      select: { onboardingComplete: true, preferredCurrency: true, name: true, timezone: true },
    })
    const timezone = profile?.timezone || "UTC"
    const { year: currentYear, month: currentMonth } = getZonedYearMonth(now, timezone)

    // Current month start & end dates
    const { start: startOfMonth, end: endOfMonth } = getZonedMonthRange(currentYear, currentMonth, timezone)

    // 1. Fetch all accounts and user assets
    const [accounts, assets] = await Promise.all([
      db.account.findMany({ where: { userId } }),
      db.asset.findMany({ where: { userId } }),
    ])

    // 2. Fetch all user transactions to compute net total balance
    const allTransactions = await db.transaction.findMany({
      where: { userId },
      select: { type: true, amount: true },
    })

    let initialAccountsBalance = accounts.reduce((acc, a) => addMoney(acc, a.openingBalance), 0)
    let netTransactionsBalance = allTransactions.reduce((acc, t) => {
      return t.type === "INCOME" ? addMoney(acc, t.amount) : subtractMoney(acc, t.amount)
    }, 0)
    const accountsBalance = addMoney(initialAccountsBalance, netTransactionsBalance)

    // Net worth = Assets total if assets tracked, otherwise accounts balance
    const assetsTotal = assets.reduce((sum, a) => addMoney(sum, a.value), 0)
    const totalBalance = assets.length > 0 ? assetsTotal : accountsBalance

    // Fetch the complete six-month reporting range once, then group in memory.
    const firstTrendMonth = new Date(Date.UTC(currentYear, currentMonth - 6, 1))
    const sixMonthStart = getZonedMonthRange(firstTrendMonth.getUTCFullYear(), firstTrendMonth.getUTCMonth() + 1, timezone).start
    const trendTransactions = await db.transaction.findMany({
      where: {
        userId,
        date: { gte: sixMonthStart, lte: endOfMonth },
      },
      include: { category: true },
    })
    const currentMonthTransactions = trendTransactions.filter(
      (transaction) => transaction.date >= startOfMonth && transaction.date <= endOfMonth
    )

    let currentMonthIncome = 0
    let currentMonthExpenses = 0
    const categorySpendingMap: Record<string, { name: string; color: string; total: number }> = {}

    for (const t of currentMonthTransactions) {
      if (t.type === "INCOME") {
        currentMonthIncome = addMoney(currentMonthIncome, t.amount)
      } else {
        currentMonthExpenses = addMoney(currentMonthExpenses, t.amount)
        const catId = t.categoryId
        const catName = t.category?.name || "Other"
        const catColor = t.category?.color || "#10b981"

        if (!categorySpendingMap[catId]) {
          categorySpendingMap[catId] = { name: catName, color: catColor, total: 0 }
        }
        categorySpendingMap[catId].total = addMoney(categorySpendingMap[catId].total, t.amount)
      }
    }

    const currentMonthNetFlow = subtractMoney(currentMonthIncome, currentMonthExpenses)

    // Format spending by category
    const spendingByCategory = Object.values(categorySpendingMap)
      .map((item) => ({
        name: item.name,
        value: item.total,
        color: item.color,
        percentage: currentMonthExpenses > 0 ? calculatePercentage(item.total, currentMonthExpenses) : 0,
      }))
      .sort((a, b) => b.value - a.value)

    // 4. Past 6 months income vs expenses trend
    const monthlyTrends: { month: string; income: number; expenses: number }[] = []
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(currentYear, currentMonth - 1 - i, 1))
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      const monthTx = trendTransactions.filter(
        (transaction) => {
          const period = getZonedYearMonth(transaction.date, timezone)
          return period.year === y && period.month === m
        }
      )

      const inc = monthTx.filter((t) => t.type === "INCOME").reduce((sum, t) => addMoney(sum, t.amount), 0)
      const exp = monthTx.filter((t) => t.type === "EXPENSE").reduce((sum, t) => addMoney(sum, t.amount), 0)

      monthlyTrends.push({
        month: `${monthNames[m - 1]} ${y.toString().slice(2)}`,
        income: inc,
        expenses: exp,
      })
    }

    // 5. Recent 5 transactions
    const recentTransactions = await db.transaction.findMany({
      where: { userId },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: "desc" },
      take: 5,
    })

    // 6. Upcoming recurring transactions
    const upcomingRecurring = await db.recurringTransaction.findMany({
      where: { userId, isActive: true },
      include: { category: true, account: true },
      orderBy: { nextRunDate: "asc" },
      take: 4,
    })

    // 7. Active savings goals
    const savingsGoalsData = await db.savingsGoal.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 4,
    })

    const savingsGoals = savingsGoalsData.map((goal) => ({
      ...goal,
      percentage: calculatePercentage(goal.currentAmount, goal.targetAmount),
      remaining: Math.max(0, subtractMoney(goal.targetAmount, goal.currentAmount)),
    }))

    // 8. Current month budgets with progress
    const budgetsData = await db.budget.findMany({
      where: { userId, month: currentMonth, year: currentYear },
      include: { category: true },
    })

    const budgets = budgetsData.map((b) => {
      const spent = categorySpendingMap[b.categoryId]?.total || 0
      const percent = calculatePercentage(spent, b.amount)
      const status = getBudgetStatus(spent, b.amount, b.alertThreshold)
      const remaining = Math.max(0, subtractMoney(b.amount, spent))

      return {
        id: b.id,
        category: b.category,
        amount: b.amount,
        spent,
        remaining,
        percent,
        status,
        alertThreshold: b.alertThreshold,
      }
    })

    // 9. Latest Financial Insights preview
    const latestInsight = await db.financialInsight.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      onboardingComplete: profile?.onboardingComplete ?? true,
      totalTransactionsCount: allTransactions.length,
      preferredCurrency: profile?.preferredCurrency || "USD",
      metrics: {
        totalBalance,
        currentMonthIncome,
        currentMonthExpenses,
        currentMonthNetFlow,
      },
      spendingByCategory,
      monthlyTrends,
      recentTransactions,
      upcomingRecurring,
      savingsGoals,
      budgets,
      latestInsight,
    })
  } catch (error) {
    console.error("Dashboard GET error:", error)
    return NextResponse.json({ message: "Failed to load dashboard data" }, { status: 500 })
  }
}
