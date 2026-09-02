import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const CopyBudgetSchema = z.object({
  targetMonth: z.coerce.number().int().min(1).max(12),
  targetYear: z.coerce.number().int().min(2020).max(2100),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await req.json()
    const validation = CopyBudgetSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { targetMonth, targetYear } = validation.data

    // Calculate previous month
    let prevMonth = targetMonth - 1
    let prevYear = targetYear
    if (prevMonth < 1) {
      prevMonth = 12
      prevYear -= 1
    }

    // Fetch previous month budgets
    const prevBudgets = await db.budget.findMany({
      where: { userId, month: prevMonth, year: prevYear },
    })

    if (prevBudgets.length === 0) {
      return NextResponse.json(
        { message: "No budgets found in the previous month to copy", copiedCount: 0 },
        { status: 200 }
      )
    }

    let copiedCount = 0
    for (const b of prevBudgets) {
      await db.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId: b.categoryId,
            month: targetMonth,
            year: targetYear,
          },
        },
        create: {
          userId,
          categoryId: b.categoryId,
          amount: b.amount,
          month: targetMonth,
          year: targetYear,
          alertThreshold: b.alertThreshold,
        },
        update: {
          amount: b.amount,
          alertThreshold: b.alertThreshold,
        },
      })
      copiedCount++
    }

    return NextResponse.json({
      message: `Successfully copied ${copiedCount} budget${copiedCount === 1 ? "" : "s"}`,
      copiedCount,
    })
  } catch (error) {
    console.error("Failed to copy budgets:", error)
    return NextResponse.json({ message: "Failed to copy previous budgets" }, { status: 500 })
  }
}
