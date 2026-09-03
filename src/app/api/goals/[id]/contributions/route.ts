import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { addMoney, subtractMoney } from "@/lib/decimal"

const ContributionPayloadSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["CONTRIBUTION", "WITHDRAWAL"]).default("CONTRIBUTION"),
  note: z.string().optional().nullable(),
  date: z.string().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id: goalId } = params

  try {
    const goal = await db.savingsGoal.findUnique({
      where: { id: goalId },
    })

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ message: "Savings goal not found" }, { status: 404 })
    }

    const contributions = await db.goalContribution.findMany({
      where: { goalId, userId },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(contributions)
  } catch (error) {
    console.error("Failed to load contributions:", error)
    return NextResponse.json({ message: "Failed to load contributions" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id: goalId } = params

  try {
    const goal = await db.savingsGoal.findUnique({
      where: { id: goalId },
    })

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ message: "Savings goal not found" }, { status: 404 })
    }

    const body = await req.json()
    const validation = ContributionPayloadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { amount, type, note, date } = validation.data
    const contributionDate = date ? new Date(date) : new Date()

    let newCurrentAmount: number
    if (type === "CONTRIBUTION") {
      newCurrentAmount = addMoney(goal.currentAmount, amount)
    } else {
      newCurrentAmount = Math.max(0, subtractMoney(goal.currentAmount, amount))
    }

    // Check completion status transition
    let newStatus = goal.status
    if (newCurrentAmount >= goal.targetAmount && goal.status === "ACTIVE") {
      newStatus = "COMPLETED"
    } else if (newCurrentAmount < goal.targetAmount && goal.status === "COMPLETED") {
      newStatus = "ACTIVE"
    }

    const [contribution, updatedGoal] = await db.$transaction([
      db.goalContribution.create({
        data: {
          userId,
          goalId,
          amount,
          type,
          note: note || null,
          date: contributionDate,
        },
      }),
      db.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newCurrentAmount,
          status: newStatus,
        },
      }),
    ])

    return NextResponse.json({
      contribution,
      goal: updatedGoal,
      milestoneAchieved: newStatus === "COMPLETED" && goal.status !== "COMPLETED",
    })
  } catch (error) {
    console.error("Failed to record contribution:", error)
    return NextResponse.json({ message: "Failed to record contribution" }, { status: 500 })
  }
}
