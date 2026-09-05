import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { addMoney, subtractMoney, calculatePercentage } from "@/lib/decimal"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const { searchParams } = new URL(request.url)
    const monthsRange = parseInt(searchParams.get("months") || "6", 10) // 3, 6, 12

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // 1. Multi-month trends & cumulative net cash flow
    const trends: {
      month: string
      year: number
      monthIndex: number
      income: number
      expenses: number
      netSavings: number
      savingsRate: number
    }[] = []

    let totalPeriodIncome = 0
    let totalPeriodExpenses = 0

    for (let i = monthsRange - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 0, 23, 59, 59, 999)

      const txs = await db.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
        },
        select: { type: true, amount: true },
      })

      const inc = txs.filter((t) => t.type === "INCOME").reduce((acc, t) => addMoney(acc, t.amount), 0)
      const exp = txs.filter((t) => t.type === "EXPENSE").reduce((acc, t) => addMoney(acc, t.amount), 0)
      const net = subtractMoney(inc, exp)
      const sRate = inc > 0 ? calculatePercentage(Math.max(0, net), inc) : 0

      totalPeriodIncome = addMoney(totalPeriodIncome, inc)
      totalPeriodExpenses = addMoney(totalPeriodExpenses, exp)

      trends.push({
        month: `${monthNames[m - 1]} ${y.toString().slice(2)}`,
        year: y,
        monthIndex: m,
        income: inc,
        expenses: exp,
        netSavings: net,
        savingsRate: sRate,
      })
    }

    // 2. Spending by Category across selected range
    const rangeStartDate = new Date(currentYear, currentMonth - monthsRange, 1)
    const rangeEndDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)

    const allRangeTransactions = await db.transaction.findMany({
      where: {
        userId,
        date: { gte: rangeStartDate, lte: rangeEndDate },
      },
      include: { category: true },
    })

    const categoryMap: Record<string, { name: string; color: string; amount: number; count: number }> = {}
    const paymentMethodMap: Record<string, number> = {}

    for (const t of allRangeTransactions) {
      if (t.type === "EXPENSE") {
        const catId = t.categoryId
        const name = t.category?.name || "Other"
        const color = t.category?.color || "#10b981"
        if (!categoryMap[catId]) {
          categoryMap[catId] = { name, color, amount: 0, count: 0 }
        }
        categoryMap[catId].amount = addMoney(categoryMap[catId].amount, t.amount)
        categoryMap[catId].count++

        const method = t.paymentMethod || "OTHER"
        paymentMethodMap[method] = addMoney(paymentMethodMap[method] || 0, t.amount)
      }
    }

    const categoryBreakdown = Object.values(categoryMap)
      .map((c) => ({
        ...c,
        percentage: totalPeriodExpenses > 0 ? calculatePercentage(c.amount, totalPeriodExpenses) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    const paymentMethods = Object.entries(paymentMethodMap).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalPeriodExpenses > 0 ? calculatePercentage(amount, totalPeriodExpenses) : 0,
    })).sort((a, b) => b.amount - a.amount)

    // 3. Current month daily spending distribution
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1)
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const dailySpending: { day: number; date: string; amount: number }[] = []

    const currentMonthTx = allRangeTransactions.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear && t.type === "EXPENSE"
    })

    for (let day = 1; day <= daysInMonth; day++) {
      const dayTotal = currentMonthTx
        .filter((t) => new Date(t.date).getDate() === day)
        .reduce((sum, t) => addMoney(sum, t.amount), 0)

      dailySpending.push({
        day,
        date: `${monthNames[currentMonth - 1]} ${day}`,
        amount: dayTotal,
      })
    }

    return NextResponse.json({
      rangeMonths: monthsRange,
      metrics: {
        totalPeriodIncome,
        totalPeriodExpenses,
        netPeriodSavings: subtractMoney(totalPeriodIncome, totalPeriodExpenses),
        averageMonthlyIncome: monthsRange > 0 ? Number((totalPeriodIncome / monthsRange).toFixed(2)) : 0,
        averageMonthlyExpenses: monthsRange > 0 ? Number((totalPeriodExpenses / monthsRange).toFixed(2)) : 0,
      },
      trends,
      categoryBreakdown,
      paymentMethods,
      dailySpending,
    })
  } catch (error) {
    console.error("Analytics GET error:", error)
    return NextResponse.json({ message: "Failed to load analytics data" }, { status: 500 })
  }
}
