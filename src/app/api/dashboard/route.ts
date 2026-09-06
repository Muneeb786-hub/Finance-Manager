import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { addMoney, subtractMoney, calculatePercentage, getBudgetStatus } from "@/lib/decimal"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-indexed (1-12)

    // Current month start & end dates
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)

    // Fetch user profile status
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { onboardingComplete: true, preferredCurrency: true, name: true },
    })

    // 1. Fetch all accounts to compute account balances + opening balances
    const accounts = await db.account.findMany({
      where: { userId },
    })

    // 2. Fetch all user transactions to compute net total balance
    const allTransactions = await db.transaction.findMany({
      where: { userId },
      select: { type: true, amount: true },
    })

    let initialAccountsBalance = accounts.reduce((acc, a) => addMoney(acc, a.openingBalance), 0)
    let netTransactionsBalance = allTransactions.reduce((acc, t) => {
      return t.type === "INCOME" ? addMoney(acc, t.amount) : subtractMoney(acc, t.amount)
    }, 0)
    const totalBalance = addMoney(initialAccountsBalance, netTransactionsBalance)

    // 3. Current month transactions
    const currentMonthTransactions = await db.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        category: true,
      },
    })

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
      const d = new Date(currentYear, currentMonth - 1 - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0, 23, 59, 59, 999)

      const monthTx = await db.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
        select: { type: true, amount: true },
      })

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
      onboardingComplete: user?.onboardingComplete ?? true,
      totalTransactionsCount: allTransactions.length,
      preferredCurrency: user?.preferredCurrency || "USD",
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
