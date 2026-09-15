import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { parseBankAlert, detectMerchantAndCategory } from "@/lib/merchant-sync"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const SyncStatusSchema = z.enum(["PENDING", "APPROVED", "DISMISSED"])
const DemoSyncSchema = z.object({
  merchant: z.string().trim().min(1).max(200).optional(),
  amount: z.coerce.number().finite().positive().optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default("PKR"),
  channel: z.enum(["CARD", "BANK", "EASYPAISA", "JAZZCASH"]).default("CARD"),
  accountId: z.string().trim().min(1).nullable().optional(),
  suggestedCategoryName: z.string().trim().min(1).max(100).optional(),
  rawText: z.string().trim().min(1).max(10_000).optional(),
}).refine((value) => value.rawText || (value.merchant && value.amount), {
  message: "Provide an SMS alert or both merchant and amount",
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const parsedStatus = SyncStatusSchema.safeParse(searchParams.get("status") || "PENDING")
  if (!parsedStatus.success) return NextResponse.json({ message: "Invalid sync status" }, { status: 400 })

  try {
    const pending = await db.pendingSyncTransaction.findMany({
      where: {
        userId,
        status: parsedStatus.data,
      },
      include: {
        account: true,
        suggestedCategory: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(pending)
  } catch (err: any) {
    console.error("Failed to fetch pending sync:", err)
    return NextResponse.json({ message: "Failed to fetch pending sync" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const parsedBody = DemoSyncSchema.safeParse(await req.json())
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "Invalid demo sync data", errors: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    let {
      merchant,
      amount,
      currency = "PKR",
      channel = "CARD",
      accountId,
      suggestedCategoryName,
      rawText,
    } = parsedBody.data

    // If rawText provided (e.g. from SMS alert paste), parse it automatically
    if (rawText) {
      const parsed = parseBankAlert(rawText)
      if (parsed.amount > 0) amount = parsed.amount
      if (parsed.merchant) merchant = parsed.merchant
      if (parsed.channel) channel = parsed.channel
      if (parsed.suggestedCategoryName) suggestedCategoryName = parsed.suggestedCategoryName
    }

    if (!merchant || !Number.isFinite(amount) || !amount || amount <= 0) {
      return NextResponse.json(
        { message: "Merchant and positive amount are required" },
        { status: 400 }
      )
    }

    // Auto-detect category if not specified
    if (!suggestedCategoryName) {
      const detected = detectMerchantAndCategory(merchant)
      suggestedCategoryName = detected.category
    }

    // Find category ID matching suggested name (or first expense category)
    let suggestedCategoryId: string | null = null
    const matchedCategory = await db.category.findFirst({
      where: {
        userId,
        type: "EXPENSE",
        name: { contains: suggestedCategoryName, mode: "insensitive" },
      },
    })

    if (matchedCategory) {
      suggestedCategoryId = matchedCategory.id
    } else {
      const fallback = await db.category.findFirst({
        where: { userId, type: "EXPENSE" },
      })
      suggestedCategoryId = fallback?.id || null
    }

    // Find account if not provided or match by channel name
    let matchedAccountId = accountId || null
    if (matchedAccountId) {
      const ownedAccount = await db.account.findFirst({ where: { id: matchedAccountId, userId } })
      if (!ownedAccount) return NextResponse.json({ message: "Invalid ledger account" }, { status: 400 })
    }
    if (!matchedAccountId) {
      const accountMatches: Prisma.AccountWhereInput[] = [{ name: { contains: channel, mode: "insensitive" } }]
      if (channel === "CARD") accountMatches.push({ type: "CREDIT_CARD" })
      if (channel === "EASYPAISA") accountMatches.push({ type: "DIGITAL_WALLET" })
      if (channel === "BANK") accountMatches.push({ type: "BANK_ACCOUNT" })
      const accountByChannel = await db.account.findFirst({
        where: {
          userId,
          OR: accountMatches,
        },
      })
      matchedAccountId = accountByChannel?.id || null
    }

    // Create the pending sync transaction record
    const pendingItem = await db.pendingSyncTransaction.create({
      data: {
        userId,
        merchant,
        amount,
        currency,
        channel,
        accountId: matchedAccountId,
        suggestedCategoryId,
        rawAlert: rawText || null,
        status: "PENDING",
      },
      include: {
        account: true,
        suggestedCategory: true,
      },
    })

    // Create a high-priority in-app Notification asking for confirmation
    const formattedChannel =
      channel === "EASYPAISA"
        ? "Easypaisa"
        : channel === "JAZZCASH"
        ? "JazzCash"
        : channel === "CARD"
        ? "Credit/Debit Card"
        : "Bank Account"

    await db.notification.create({
      data: {
        userId,
        type: "TRANSACTION_ALERT",
        title: `New ${formattedChannel} Charge: Rs. ${amount.toLocaleString()}`,
        message: `${merchant} charged Rs. ${amount.toLocaleString()} on your ${formattedChannel}. Add this to your expenses?`,
        isRead: false,
      },
    })

    return NextResponse.json(pendingItem, { status: 201 })
  } catch (err: any) {
    console.error("Failed to record bank sync:", err)
    return NextResponse.json({ message: "Failed to record bank sync" }, { status: 500 })
  }
}
