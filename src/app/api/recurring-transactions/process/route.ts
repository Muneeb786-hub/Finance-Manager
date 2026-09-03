import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { advanceNextRunDate } from "@/lib/recurring"
import { formatCurrency } from "@/lib/utils"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const now = new Date()

    // Find all active schedules that are due
    const dueSchedules = await db.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextRunDate: { lte: now },
      },
      include: {
        category: true,
        account: true,
      },
    })

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        message: "No recurring transactions are due for processing",
        processedCount: 0,
      })
    }

    const processedItems: any[] = []

    for (const item of dueSchedules) {
      // 1. Create recorded transaction in the ledger
      const transaction = await db.transaction.create({
        data: {
          userId,
          type: item.type,
          amount: item.amount,
          categoryId: item.categoryId,
          accountId: item.accountId,
          description: `${item.description} (Recurring)`,
          paymentMethod: item.paymentMethod || "OTHER",
          date: item.nextRunDate,
          isRecurring: true,
          recurringTransactionId: item.id,
        },
      })

      // 2. Advance nextRunDate
      const nextDate = advanceNextRunDate(item.nextRunDate, item.frequency as any)
      const isExpired = item.endDate ? nextDate > new Date(item.endDate) : false

      await db.recurringTransaction.update({
        where: { id: item.id },
        data: {
          nextRunDate: nextDate,
          isActive: !isExpired,
        },
      })

      // 3. Create user notification
      await db.notification.create({
        data: {
          userId,
          type: "RECURRING_EXECUTED",
          title: `Recurring ${item.type === "INCOME" ? "Income" : "Bill"} Processed`,
          message: `${item.description} for ${formatCurrency(item.amount)} was recorded to your ledger.`,
          isRead: false,
        },
      })

      processedItems.push({
        id: item.id,
        description: item.description,
        amount: item.amount,
        type: item.type,
        nextRunDate: nextDate,
      })
    }

    return NextResponse.json({
      message: `Successfully processed ${processedItems.length} recurring item${processedItems.length === 1 ? "" : "s"}`,
      processedCount: processedItems.length,
      processedItems,
    })
  } catch (error) {
    console.error("Failed to process recurring transactions:", error)
    return NextResponse.json({ message: "Failed to process recurring transactions" }, { status: 500 })
  }
}
