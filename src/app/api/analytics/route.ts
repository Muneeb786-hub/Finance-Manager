import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { addMoney, subtractMoney, calculatePercentage } from "@/lib/decimal"
import { z } from "zod"
import { getZonedDay, getZonedMonthRange, getZonedYearMonth } from "@/lib/dates"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const { searchParams } = new URL(request.url)
    const parsedRange = z.coerce.number().int().refine((value) => [3, 6, 12].includes(value)).safeParse(searchParams.get("months") || "6")
    if (!parsedRange.success) return NextResponse.json({ message: "Months must be 3, 6, or 12" }, { status: 400 })
    const monthsRange = parsedRange.data

    const now = new Date()
    const profile = await db.user.findUnique({ where: { id: userId }, select: { timezone: true } })
    const timezone = profile?.timezone || "UTC"
    const { year: currentYear, month: currentMonth } = getZonedYearMonth(now, timezone)

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const firstMonthDate = new Date(Date.UTC(currentYear, currentMonth - monthsRange, 1))
    const rangeStartDate = getZonedMonthRange(firstMonthDate.getUTCFullYear(), firstMonthDate.getUTCMonth() + 1, timezone).start
    const rangeEndDate = getZonedMonthRange(currentYear, currentMonth, timezone).end
    const allRangeTransactions = await db.transaction.findMany({
      where: { userId, date: { gte: rangeStartDate, lte: rangeEndDate } },
      include: { category: true },
    })

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
      const d = new Date(Date.UTC(currentYear, currentMonth - 1 - i, 1))
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      const txs = allRangeTransactions.filter(
        (transaction) => {
          const period = getZonedYearMonth(transaction.date, timezone)
          return period.year === y && period.month === m
        }
      )

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
      const period = getZonedYearMonth(t.date, timezone)
      return period.month === currentMonth && period.year === currentYear && t.type === "EXPENSE"
    })

    for (let day = 1; day <= daysInMonth; day++) {
      const dayTotal = currentMonthTx
        .filter((t) => getZonedDay(t.date, timezone) === day)
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
