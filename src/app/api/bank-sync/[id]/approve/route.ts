import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { logError, requestId } from "@/lib/logger"

const ApprovalSchema = z.object({
  amount: z.coerce.number().finite().positive().optional(),
  merchant: z.string().trim().min(1).max(200).optional(),
  categoryId: z.string().min(1).optional(),
  accountId: z.string().min(1).nullable().optional(),
  isRecurring: z.boolean().optional().default(false),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = ApprovalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid approval data", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const pending = await db.pendingSyncTransaction.findFirst({ where: { id, userId } })
    if (!pending) return NextResponse.json({ message: "Pending transaction not found" }, { status: 404 })

    if (pending.status === "APPROVED" && pending.transactionId) {
      const transaction = await db.transaction.findFirst({
        where: { id: pending.transactionId, userId },
        include: { category: true, account: true },
      })
      return NextResponse.json({ success: true, duplicate: true, transaction })
    }
    if (pending.status !== "PENDING") {
      return NextResponse.json({ message: "Transaction already processed" }, { status: 409 })
    }

    const finalAmount = parsed.data.amount ?? pending.amount.toNumber()
    const finalMerchant = parsed.data.merchant ?? pending.merchant
    const finalCategoryId = parsed.data.categoryId ?? pending.suggestedCategoryId
    const finalAccountId = parsed.data.accountId === undefined ? pending.accountId : parsed.data.accountId
    if (!finalCategoryId) return NextResponse.json({ message: "Category is required" }, { status: 400 })

    const [category, account] = await Promise.all([
      db.category.findFirst({ where: { id: finalCategoryId, userId, type: "EXPENSE" } }),
      finalAccountId ? db.account.findFirst({ where: { id: finalAccountId, userId } }) : null,
    ])
    if (!category) return NextResponse.json({ message: "Invalid expense category" }, { status: 400 })
    if (finalAccountId && !account) return NextResponse.json({ message: "Invalid account" }, { status: 400 })

    const transaction = await db.$transaction(async (tx) => {
      const claimed = await tx.pendingSyncTransaction.updateMany({
        where: { id: pending.id, userId, status: "PENDING" },
        data: { status: "APPROVED" },
      })
      if (claimed.count !== 1) throw new Error("SYNC_ALREADY_PROCESSED")

      const txDate = new Date()
      let recurringId: string | null = null
      if (parsed.data.isRecurring) {
        const nextRun = new Date(txDate)
        nextRun.setUTCMonth(nextRun.getUTCMonth() + 1)
        const recurring = await tx.recurringTransaction.create({
          data: {
            userId,
            type: "EXPENSE",
            amount: finalAmount,
            categoryId: finalCategoryId,
            accountId: finalAccountId,
            description: finalMerchant,
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

      const created = await tx.transaction.create({
        data: {
          userId,
          type: "EXPENSE",
          amount: finalAmount,
          categoryId: finalCategoryId,
          accountId: finalAccountId,
          date: txDate,
          description: finalMerchant,
          paymentMethod: pending.channel,
          tags: [pending.channel.toLowerCase(), "demo-sync"],
          isRecurring: parsed.data.isRecurring,
          recurringTransactionId: recurringId,
        },
        include: { category: true, account: true },
      })

      await tx.pendingSyncTransaction.update({
        where: { id: pending.id },
        data: { transactionId: created.id },
      })
      return created
    }, { isolationLevel: "Serializable" })

    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    const concurrentConflict = error && typeof error === "object" && "code" in error && (error.code === "P2002" || error.code === "P2034")
    if ((error instanceof Error && error.message === "SYNC_ALREADY_PROCESSED") || concurrentConflict) {
      const pending = await db.pendingSyncTransaction.findFirst({ where: { id, userId } })
      const transaction = pending?.transactionId
        ? await db.transaction.findFirst({ where: { id: pending.transactionId, userId }, include: { category: true, account: true } })
        : null
      return NextResponse.json({ success: true, duplicate: true, transaction })
    }
    logError("demo_sync_approval_failed", error, { requestId: requestId(req), pendingId: id })
    return NextResponse.json({ message: "Failed to approve transaction" }, { status: 500 })
  }
}
