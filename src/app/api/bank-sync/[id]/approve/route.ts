import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
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
    const pending = await db.pendingSyncTransaction.findUnique({
      where: { id },
      include: {
        account: true,
        suggestedCategory: true,
      },
    })

    if (!pending || pending.userId !== userId) {
      return NextResponse.json({ message: "Pending transaction not found" }, { status: 404 })
    }

    if (pending.status !== "PENDING") {
      return NextResponse.json({ message: "Transaction already processed" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const finalAmount = body.amount !== undefined ? parseFloat(body.amount) : pending.amount
    const finalCategoryId = body.categoryId || pending.suggestedCategoryId
    const finalAccountId = body.accountId || pending.accountId
    const isRecurring = Boolean(body.isRecurring)

    if (!finalCategoryId) {
      return NextResponse.json({ message: "Category is required" }, { status: 400 })
    }

    const txDate = new Date()
    let recurringId: string | null = null

    // If marked as recurring / subscription, create schedule for next month
    if (isRecurring) {
      const nextRun = new Date(txDate)
      nextRun.setMonth(nextRun.getMonth() + 1)

      const recurring = await db.recurringTransaction.create({
        data: {
          userId,
          type: "EXPENSE",
          amount: finalAmount,
          categoryId: finalCategoryId,
          accountId: finalAccountId,
          description: pending.merchant,
          paymentMethod: pending.channel,
          frequency: "MONTHLY",
          startDate: txDate,
          nextRunDate: nextRun,
          isActive: true,
          isSubscription: true,
        },
      })
      recurringId = recurring.id
    }

    // Create the ledger transaction
    const transaction = await db.transaction.create({
      data: {
        userId,
        type: "EXPENSE",
        amount: finalAmount,
        categoryId: finalCategoryId,
        accountId: finalAccountId,
        date: txDate,
        description: pending.merchant,
        paymentMethod: pending.channel,
        tags: [pending.channel.toLowerCase(), "auto-sync"],
        isRecurring,
        recurringTransactionId: recurringId,
      },
      include: {
        category: true,
        account: true,
      },
    })

    // Mark pending sync record as approved
    await db.pendingSyncTransaction.update({
      where: { id },
      data: {
        status: "APPROVED",
        transactionId: transaction.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Recorded ${pending.merchant} expense of Rs. ${finalAmount.toLocaleString()}`,
      transaction,
    })
  } catch (err: any) {
    console.error("Failed to approve transaction:", err)
    return NextResponse.json({ message: "Failed to approve transaction" }, { status: 500 })
  }
}
