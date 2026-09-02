import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const UpdateBudgetSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  alertThreshold: z.coerce.number().min(1).max(100).default(80),
})

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
    const existing = await db.budget.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    const body = await req.json()
    const validation = UpdateBudgetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updated = await db.budget.update({
      where: { id },
      data: {
        amount: validation.data.amount,
        alertThreshold: validation.data.alertThreshold,
      },
      include: { category: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update budget:", error)
    return NextResponse.json({ message: "Failed to update budget" }, { status: 500 })
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
    const existing = await db.budget.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    await db.budget.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Budget deleted successfully" })
  } catch (error) {
    console.error("Failed to delete budget:", error)
    return NextResponse.json({ message: "Failed to delete budget" }, { status: 500 })
  }
}
