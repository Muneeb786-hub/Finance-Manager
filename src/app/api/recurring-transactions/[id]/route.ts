import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const UpdateRecurringSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  categoryId: z.string().min(1).optional(),
  accountId: z.string().optional().nullable(),
  description: z.string().min(1).optional(),
  paymentMethod: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  nextRunDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isSubscription: z.boolean().optional(),
  subcategory: z.string().optional().nullable(),
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
    const schedule = await db.recurringTransaction.findUnique({
      where: { id },
      include: {
        category: true,
        account: true,
        transactions: {
          take: 5,
          orderBy: { date: "desc" },
        },
      },
    })

    if (!schedule || schedule.userId !== userId) {
      return NextResponse.json({ message: "Recurring schedule not found" }, { status: 404 })
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Failed to load recurring schedule:", error)
    return NextResponse.json({ message: "Failed to load schedule" }, { status: 500 })
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
    const existing = await db.recurringTransaction.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Recurring schedule not found" }, { status: 404 })
    }

    const body = await req.json()
    const validation = UpdateRecurringSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (validation.data.type !== undefined) updateData.type = validation.data.type
    if (validation.data.amount !== undefined) updateData.amount = validation.data.amount
    if (validation.data.categoryId !== undefined) updateData.categoryId = validation.data.categoryId
    if (validation.data.accountId !== undefined) updateData.accountId = validation.data.accountId || null
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.paymentMethod !== undefined) updateData.paymentMethod = validation.data.paymentMethod
    if (validation.data.frequency !== undefined) updateData.frequency = validation.data.frequency
    if (validation.data.nextRunDate !== undefined) updateData.nextRunDate = new Date(validation.data.nextRunDate)
    if (validation.data.endDate !== undefined) {
      updateData.endDate = validation.data.endDate ? new Date(validation.data.endDate) : null
    }
    if (validation.data.isActive !== undefined) updateData.isActive = validation.data.isActive
    if (validation.data.isSubscription !== undefined) updateData.isSubscription = validation.data.isSubscription
    if (validation.data.subcategory !== undefined) updateData.subcategory = validation.data.subcategory || null

    const updated = await db.recurringTransaction.update({
      where: { id },
      data: updateData,
      include: { category: true, account: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update recurring schedule:", error)
    return NextResponse.json({ message: "Failed to update schedule" }, { status: 500 })
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
    const existing = await db.recurringTransaction.findUnique({
      where: { id },
    })

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Recurring schedule not found" }, { status: 404 })
    }

    await db.recurringTransaction.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Recurring schedule deleted successfully" })
  } catch (error) {
    console.error("Failed to delete recurring schedule:", error)
    return NextResponse.json({ message: "Failed to delete schedule" }, { status: 500 })
  }
}
