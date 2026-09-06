import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { parseBankAlert, detectMerchantAndCategory } from "@/lib/merchant-sync"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get("status") || "PENDING"

  try {
    const pending = await db.pendingSyncTransaction.findMany({
      where: {
        userId,
        status: statusParam as any,
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
    const body = await req.json()
    let {
      merchant,
      amount,
      currency = "PKR",
      channel = "CARD",
      accountId,
      suggestedCategoryName,
      rawText,
    } = body

    // If rawText provided (e.g. from SMS alert paste), parse it automatically
    if (rawText) {
      const parsed = parseBankAlert(rawText)
      if (parsed.amount > 0) amount = parsed.amount
      if (parsed.merchant) merchant = parsed.merchant
      if (parsed.channel) channel = parsed.channel
      if (parsed.suggestedCategoryName) suggestedCategoryName = parsed.suggestedCategoryName
    }

    if (!merchant || !amount || amount <= 0) {
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
    if (!matchedAccountId) {
      const accountByChannel = await db.account.findFirst({
        where: {
          userId,
          OR: [
            { name: { contains: channel, mode: "insensitive" } },
            channel === "CARD" ? { type: "CREDIT_CARD" } : {},
            channel === "EASYPAISA" ? { type: "DIGITAL_WALLET" } : {},
            channel === "BANK" ? { type: "BANK_ACCOUNT" } : {},
          ].filter(Boolean) as any,
        },
      })
      matchedAccountId = accountByChannel?.id || null
    }

    // Create the pending sync transaction record
    const pendingItem = await db.pendingSyncTransaction.create({
      data: {
        userId,
        merchant,
        amount: parseFloat(amount),
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
        title: `New ${formattedChannel} Charge: Rs. ${parseFloat(amount).toLocaleString()}`,
        message: `${merchant} charged Rs. ${parseFloat(amount).toLocaleString()} on your ${formattedChannel}. Add this to your expenses?`,
        isRead: false,
      },
    })

    return NextResponse.json(pendingItem, { status: 201 })
  } catch (err: any) {
    console.error("Failed to record bank sync:", err)
    return NextResponse.json({ message: "Failed to record bank sync" }, { status: 500 })
  }
}
