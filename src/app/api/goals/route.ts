import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { SavingsGoalSchema } from "@/lib/validations"
import { addMoney, subtractMoney, calculatePercentage } from "@/lib/decimal"

function calculateMonthlyRequired(targetAmount: number, currentAmount: number, targetDate: Date | null): number | null {
  if (!targetDate) return null
  const now = new Date()
  const target = new Date(targetDate)
  if (target <= now) return null

  const remaining = Math.max(0, subtractMoney(targetAmount, currentAmount))
  if (remaining <= 0) return 0

  const yearsDiff = target.getFullYear() - now.getFullYear()
  const monthsDiff = target.getMonth() - now.getMonth()
  const daysDiff = target.getDate() - now.getDate()

  // Calculate approximate months remaining (min 1)
  let totalMonths = yearsDiff * 12 + monthsDiff
  if (daysDiff > 10) totalMonths += 1
  totalMonths = Math.max(1, totalMonths)

  return Math.round((remaining / totalMonths) * 100) / 100
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status") || "ALL"

  try {
    const whereClause: any = { userId }
    if (statusFilter !== "ALL") {
      whereClause.status = statusFilter
    }

    const goalsData = await db.savingsGoal.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { contributions: true },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    })

    let totalTargetAmount = 0
    let totalCurrentAmount = 0
    let activeCount = 0
    let completedCount = 0

    const goals = goalsData.map((goal) => {
      const percentage = calculatePercentage(goal.currentAmount, goal.targetAmount)
      const remaining = Math.max(0, subtractMoney(goal.targetAmount, goal.currentAmount))
      const monthlyRequired = calculateMonthlyRequired(goal.targetAmount, goal.currentAmount, goal.targetDate)
      const isComplete = goal.currentAmount >= goal.targetAmount || goal.status === "COMPLETED"

      if (goal.status === "ACTIVE") {
        totalTargetAmount = addMoney(totalTargetAmount, goal.targetAmount)
        totalCurrentAmount = addMoney(totalCurrentAmount, goal.currentAmount)
        activeCount++
      } else if (goal.status === "COMPLETED") {
        completedCount++
      }

      return {
        ...goal,
        percentage,
        remaining,
        monthlyRequired,
        isComplete,
        contributionCount: goal._count.contributions,
      }
    })

    const overallPercentage = totalTargetAmount > 0 ? calculatePercentage(totalCurrentAmount, totalTargetAmount) : 0

    return NextResponse.json({
      goals,
      summary: {
        totalTargetAmount,
        totalCurrentAmount,
        overallPercentage,
        activeCount,
        completedCount,
        totalCount: goals.length,
      },
    })
  } catch (error) {
    console.error("Failed to load savings goals:", error)
    return NextResponse.json({ message: "Failed to load savings goals" }, { status: 500 })
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
    const validation = SavingsGoalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, targetAmount, currentAmount = 0, targetDate, icon = "target", color = "#3b82f6", notes } = validation.data

    const isCompleted = currentAmount >= targetAmount

    const goal = await db.savingsGoal.create({
      data: {
        userId,
        title,
        targetAmount,
        currentAmount,
        targetDate: targetDate ? new Date(targetDate) : null,
        icon,
        color,
        notes: notes || null,
        status: isCompleted ? "COMPLETED" : "ACTIVE",
      },
    })

    // If initial funds were provided, record an opening contribution
    if (currentAmount > 0) {
      await db.goalContribution.create({
        data: {
          userId,
          goalId: goal.id,
          amount: currentAmount,
          type: "CONTRIBUTION",
          note: "Initial seed deposit",
          date: new Date(),
        },
      })
    }

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error("Failed to create savings goal:", error)
    return NextResponse.json({ message: "Failed to create savings goal" }, { status: 500 })
  }
}
