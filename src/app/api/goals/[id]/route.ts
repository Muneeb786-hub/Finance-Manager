import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const UpdateSavingsGoalSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  category: z.string().optional().nullable(),
  targetAmount: z.coerce.number().positive("Target amount must be greater than 0").optional(),
  targetDate: z.string().optional().nullable(),
  icon: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
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
  const { id } = params

  try {
    const goal = await db.savingsGoal.findUnique({
      where: { id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
    })

    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ message: "Savings goal not found" }, { status: 404 })
    }

    return NextResponse.json(goal)
  } catch (error) {
    console.error("Failed to load goal:", error)
    return NextResponse.json({ message: "Failed to load goal" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const existing = await db.savingsGoal.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Savings goal not found" }, { status: 404 })
    }

    const body = await req.json()
    const validation = UpdateSavingsGoalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (validation.data.title !== undefined) updateData.title = validation.data.title
    if (validation.data.category !== undefined) updateData.category = validation.data.category ? validation.data.category.trim() : "General"
    if (validation.data.targetAmount !== undefined) updateData.targetAmount = validation.data.targetAmount
    if (validation.data.targetDate !== undefined) {
      updateData.targetDate = validation.data.targetDate ? new Date(validation.data.targetDate) : null
    }
    if (validation.data.icon !== undefined) updateData.icon = validation.data.icon
    if (validation.data.color !== undefined) updateData.color = validation.data.color
    if (validation.data.notes !== undefined) updateData.notes = validation.data.notes
    if (validation.data.status !== undefined) updateData.status = validation.data.status

    const updated = await db.savingsGoal.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update savings goal:", error)
    return NextResponse.json({ message: "Failed to update savings goal" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const existing = await db.savingsGoal.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Savings goal not found" }, { status: 404 })
    }

    await db.savingsGoal.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Savings goal deleted successfully" })
  } catch (error) {
    console.error("Failed to delete savings goal:", error)
    return NextResponse.json({ message: "Failed to delete savings goal" }, { status: 500 })
  }
}
