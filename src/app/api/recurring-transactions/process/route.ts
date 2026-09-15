import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { advanceNextRunDate } from "@/lib/recurring"
import { formatCurrency } from "@/lib/utils"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  const userId = (session.user as { id: string }).id

  try {
    const profile = await db.user.findUnique({ where: { id: userId }, select: { preferredCurrency: true } })
    const currency = profile?.preferredCurrency || "USD"
    const now = new Date()
    const dueSchedules = await db.recurringTransaction.findMany({
      where: { userId, isActive: true, nextRunDate: { lte: now } },
      orderBy: { nextRunDate: "asc" },
    })
    const processedItems: Array<{ id: string; description: string; amount: number; type: "INCOME" | "EXPENSE"; nextRunDate: Date }> = []

    for (const due of dueSchedules) {
      try {
        const result = await db.$transaction(async (tx) => {
          const current = await tx.recurringTransaction.findFirst({
            where: { id: due.id, userId, isActive: true, nextRunDate: { lte: now } },
          })
          if (!current) return null

          const occurrenceDate = current.nextRunDate
          const occurrenceKey = `recurring:${current.id}:${occurrenceDate.toISOString()}`
          const nextDate = advanceNextRunDate(occurrenceDate, current.frequency)
          const isExpired = current.endDate ? nextDate > current.endDate : false
          const advanced = await tx.recurringTransaction.updateMany({
            where: { id: current.id, userId, isActive: true, nextRunDate: occurrenceDate },
            data: { nextRunDate: nextDate, isActive: !isExpired },
          })
          if (advanced.count !== 1) return null

          await tx.transaction.create({
            data: {
              userId,
              type: current.type,
              amount: current.amount,
              categoryId: current.categoryId,
              accountId: current.accountId,
              description: `${current.description} (Recurring)`,
              paymentMethod: current.paymentMethod || "OTHER",
              date: occurrenceDate,
              isRecurring: true,
              recurringTransactionId: current.id,
              occurrenceKey,
            },
          })
          await tx.notification.create({
            data: {
              userId,
              type: "RECURRING_EXECUTED",
              title: `Recurring ${current.type === "INCOME" ? "Income" : "Bill"} Processed`,
              message: `${current.description} for ${formatCurrency(current.amount.toNumber(), currency)} was recorded to your ledger.`,
            },
          })
          return { id: current.id, description: current.description, amount: current.amount.toNumber(), type: current.type, nextRunDate: nextDate }
        }, { isolationLevel: "Serializable" })
        if (result) processedItems.push(result)
      } catch (error) {
        if (!(error && typeof error === "object" && "code" in error && (error.code === "P2002" || error.code === "P2034"))) throw error
      }
    }

    return NextResponse.json({
      message: processedItems.length
        ? `Successfully processed ${processedItems.length} recurring item${processedItems.length === 1 ? "" : "s"}`
        : "No recurring transactions are due for processing",
      processedCount: processedItems.length,
      processedItems,
    })
  } catch (error) {
    console.error("Failed to process recurring transactions:", error)
    return NextResponse.json({ message: "Failed to process recurring transactions" }, { status: 500 })
  }
}
