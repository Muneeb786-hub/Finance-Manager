import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { RecurringTransactionSchema } from "@/lib/validations"
import { calculateMonthlyEquivalent } from "@/lib/recurring"
import { addMoney, subtractMoney } from "@/lib/decimal"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status") || "ALL"
  const isSubscriptionParam = searchParams.get("isSubscription")
  const subcategoryParam = searchParams.get("subcategory")

  try {
    const whereClause: any = { userId }
    if (statusFilter === "ACTIVE") whereClause.isActive = true
    else if (statusFilter === "PAUSED") whereClause.isActive = false

    if (isSubscriptionParam === "true") {
      whereClause.isSubscription = true
    } else if (isSubscriptionParam === "false") {
      whereClause.isSubscription = false
    }

    if (subcategoryParam && subcategoryParam !== "ALL") {
      whereClause.subcategory = subcategoryParam
    }

    const rawSchedules = await db.recurringTransaction.findMany({
      where: whereClause,
      include: {
        category: true,
        account: true,
      },
      orderBy: [{ isActive: "desc" }, { nextRunDate: "asc" }],
    })

    const now = new Date()
    let projectedMonthlyIncome = 0
    let projectedMonthlyExpenses = 0
    let activeCount = 0
    let pausedCount = 0
    let dueCount = 0

    // Subscription specific analytics
    let monthlySubscriptionTotal = 0
    const subcategorySpendMap: Record<string, { totalMonthly: number; count: number }> = {}

    const schedules = rawSchedules.map((item) => {
      const isDue = item.isActive && new Date(item.nextRunDate) <= now
      const isExpired = item.endDate ? new Date(item.endDate) < now : false
      const monthlyAmount = calculateMonthlyEquivalent(item.amount, item.frequency as any)

      if (item.isActive && !isExpired) {
        activeCount++
        if (item.type === "INCOME") {
          projectedMonthlyIncome = addMoney(projectedMonthlyIncome, monthlyAmount)
        } else {
          projectedMonthlyExpenses = addMoney(projectedMonthlyExpenses, monthlyAmount)
          if (item.isSubscription) {
            monthlySubscriptionTotal = addMoney(monthlySubscriptionTotal, monthlyAmount)
            const subcat = item.subcategory || "Other"
            if (!subcategorySpendMap[subcat]) {
              subcategorySpendMap[subcat] = { totalMonthly: 0, count: 0 }
            }
            subcategorySpendMap[subcat].totalMonthly = addMoney(
              subcategorySpendMap[subcat].totalMonthly,
              monthlyAmount
            )
            subcategorySpendMap[subcat].count++
          }
        }
      } else {
        pausedCount++
      }

      if (isDue) {
        dueCount++
      }

      return {
        ...item,
        isDue,
        isExpired,
        monthlyAmount,
      }
    })

    const projectedNetCashFlow = subtractMoney(projectedMonthlyIncome, projectedMonthlyExpenses)

    return NextResponse.json({
      schedules,
      summary: {
        projectedMonthlyIncome,
        projectedMonthlyExpenses,
        projectedNetCashFlow,
        activeCount,
        pausedCount,
        dueCount,
        totalCount: schedules.length,
        monthlySubscriptionTotal,
        annualSubscriptionTotal: Math.round(monthlySubscriptionTotal * 12 * 100) / 100,
        subcategoryBreakdown: subcategorySpendMap,
      },
    })
  } catch (error) {
    console.error("Failed to load recurring transactions:", error)
    return NextResponse.json({ message: "Failed to load recurring schedules" }, { status: 500 })
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
    const validation = RecurringTransactionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      type,
      amount,
      categoryId,
      accountId,
      description,
      paymentMethod = "OTHER",
      frequency,
      startDate,
      endDate,
      isSubscription = false,
      subcategory = null,
    } = validation.data

    // Verify category
    let finalCategoryId = categoryId
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId }, { isDefault: true }],
      },
    })

    if (!category) {
      // If subscription and category not found, check if a Subscriptions category exists or fallback to first expense category
      const subCat = await db.category.findFirst({
        where: {
          userId,
          name: { contains: "subscription", mode: "insensitive" },
        },
      })
      if (subCat) {
        finalCategoryId = subCat.id
      } else {
        const fallbackCat = await db.category.findFirst({
          where: { userId, type: "EXPENSE" },
        })
        if (fallbackCat) {
          finalCategoryId = fallbackCat.id
        } else {
          return NextResponse.json({ message: "Category not found" }, { status: 404 })
        }
      }
    }

    // Verify account if provided
    if (accountId) {
      const account = await db.account.findFirst({
        where: { id: accountId, userId },
      })
      if (!account) {
        return NextResponse.json({ message: "Account not found" }, { status: 404 })
      }
    }

    const startDateTime = new Date(startDate)
    const endDateTime = endDate ? new Date(endDate) : null

    const schedule = await db.recurringTransaction.create({
      data: {
        userId,
        type,
        amount,
        categoryId: finalCategoryId,
        accountId: accountId || null,
        description,
        paymentMethod,
        frequency,
        startDate: startDateTime,
        nextRunDate: startDateTime,
        endDate: endDateTime,
        isActive: true,
        isSubscription: Boolean(isSubscription),
        subcategory: subcategory || null,
      },
      include: {
        category: true,
        account: true,
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error("Failed to create recurring transaction:", error)
    return NextResponse.json({ message: "Failed to create recurring schedule" }, { status: 500 })
  }
}
