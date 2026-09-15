import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseBankAlert } from "@/lib/merchant-sync"
import crypto from "crypto"
import { checkRateLimit, configuredLimit, getClientAddress, rateLimitResponse } from "@/lib/rate-limit"
import { Prisma } from "@prisma/client"
import { logError, requestId } from "@/lib/logger"
import { z } from "zod"

const WebhookPayloadSchema = z.object({
  token: z.string().max(256).optional(),
  text: z.string().max(10_000).optional(),
  message: z.string().max(10_000).optional(),
  sms: z.string().max(10_000).optional(),
  body: z.string().max(10_000).optional(),
  sender: z.string().max(100).optional(),
  from: z.string().max(100).optional(),
}).passthrough()

export async function POST(req: Request) {
  const rate = checkRateLimit("demo-sync-webhook", getClientAddress(req), configuredLimit("RATE_LIMIT_WEBHOOK_MAX", 60), 60 * 1000)
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

  try {
    const { searchParams } = new URL(req.url)
    const parsedBody = WebhookPayloadSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsedBody.success) {
      return NextResponse.json({ message: "Invalid webhook payload" }, { status: 400 })
    }
    const body = parsedBody.data

    // 1. Extract and validate user webhook token
    const tokenFromQuery = searchParams.get("token")
    const tokenFromBody = body.token
    const authHeader = req.headers.get("authorization")
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    const token = tokenFromQuery || tokenFromBody || tokenFromHeader

    if (!token) {
      return NextResponse.json(
        { message: "Missing webhook token. Please provide your secure sync token." },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { syncWebhookToken: token },
    })

    if (!user) {
      return NextResponse.json(
        { message: "Invalid sync token. Account not found." },
        { status: 403 }
      )
    }

    const rawText = body.text || body.message || body.sms || body.body || ""
    const sender = body.sender || body.from || searchParams.get("sender") || ""

    if (!rawText.trim()) {
      return NextResponse.json(
        { message: "No SMS or transaction alert text provided in payload" },
        { status: 400 }
      )
    }

    const sourceFingerprint = crypto
      .createHash("sha256")
      .update(`${user.id}:${sender}:${rawText.trim().replace(/\s+/g, " ")}`)
      .digest("hex")

    const existingPending = await db.pendingSyncTransaction.findFirst({
      where: { userId: user.id, sourceFingerprint },
      include: { account: true, suggestedCategory: true },
    })
    if (existingPending) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "This demo SMS alert was already received",
        pendingTransaction: existingPending,
      })
    }

    // 2. Parse SMS alert
    const parsed = parseBankAlert(rawText)

    if (!parsed.merchant || parsed.amount <= 0) {
      return NextResponse.json(
        {
          message: "Could not parse a valid transaction amount or merchant from this alert message",
          parsed,
        },
        { status: 422 }
      )
    }

    // 3. Find matched linked account for user
    const linkedAccounts = await db.linkedAccountSync.findMany({
      where: { userId: user.id, isActive: true },
      include: { account: true },
    })

    let matchedAccountId: string | null = null
    let matchedLinkedSyncId: string | null = null

    // Attempt matching:
    // A. By extracted card last 4 digits or mobile phone number
    if (parsed.extractedIdentifier) {
      const matchByIdentifier = linkedAccounts.find((acc) =>
        acc.identifier.includes(parsed.extractedIdentifier!) ||
        parsed.extractedIdentifier!.includes(acc.identifier)
      )
      if (matchByIdentifier) {
        matchedAccountId = matchByIdentifier.accountId
        matchedLinkedSyncId = matchByIdentifier.id
      }
    }

    // B. By sender ID (e.g. 3737 for Easypaisa, 8558 for JazzCash)
    if (!matchedAccountId && sender) {
      const matchBySender = linkedAccounts.find((acc) =>
        acc.senderId && sender.toLowerCase().includes(acc.senderId.toLowerCase())
      )
      if (matchBySender) {
        matchedAccountId = matchBySender.accountId
        matchedLinkedSyncId = matchBySender.id
      }
    }

    // C. By channel/provider hint
    if (!matchedAccountId && parsed.providerHint) {
      const matchByProvider = linkedAccounts.find(
        (acc) => acc.provider === parsed.providerHint
      )
      if (matchByProvider) {
        matchedAccountId = matchByProvider.accountId
        matchedLinkedSyncId = matchByProvider.id
      }
    }

    // D. Fallback to existing account by channel name
    if (!matchedAccountId) {
      const accountMatches: Prisma.AccountWhereInput[] = [{ name: { contains: parsed.channel, mode: "insensitive" } }]
      if (parsed.channel === "CARD") accountMatches.push({ type: "CREDIT_CARD" })
      if (parsed.channel === "EASYPAISA") accountMatches.push({ type: "DIGITAL_WALLET" })
      if (parsed.channel === "BANK") accountMatches.push({ type: "BANK_ACCOUNT" })
      const fallbackAccount = await db.account.findFirst({
        where: {
          userId: user.id,
          OR: accountMatches,
        },
      })
      matchedAccountId = fallbackAccount?.id || null
    }

    // Update lastSyncedAt on the linked account if matched
    if (matchedLinkedSyncId) {
      await db.linkedAccountSync.update({
        where: { id: matchedLinkedSyncId },
        data: { lastSyncedAt: new Date() },
      }).catch(() => {})
    }

    // 4. Find matching category for suggested category name
    let suggestedCategoryId: string | null = null
    const matchedCategory = await db.category.findFirst({
      where: {
        userId: user.id,
        type: "EXPENSE",
        name: { contains: parsed.suggestedCategoryName, mode: "insensitive" },
      },
    })
    if (matchedCategory) {
      suggestedCategoryId = matchedCategory.id
    } else {
      const fallbackCategory = await db.category.findFirst({
        where: { userId: user.id, type: "EXPENSE" },
      })
      suggestedCategoryId = fallbackCategory?.id || null
    }

    // 5. Create PendingSyncTransaction
    // 6. Create the pending item and its notification atomically.
    const formattedChannel =
      parsed.channel === "EASYPAISA"
        ? "Easypaisa"
        : parsed.channel === "JAZZCASH"
        ? "JazzCash"
        : parsed.channel === "CARD"
        ? "Credit Card"
        : "Bank Account"

    let pendingItem
    try {
      pendingItem = await db.$transaction(async (tx) => {
        const created = await tx.pendingSyncTransaction.create({
          data: {
            userId: user.id,
            merchant: parsed.merchant,
            amount: parsed.amount,
            currency: parsed.currency || "PKR",
            channel: parsed.channel,
            accountId: matchedAccountId,
            suggestedCategoryId,
            rawAlert: rawText,
            sourceFingerprint,
            status: "PENDING",
          },
          include: { account: true, suggestedCategory: true },
        })
        await tx.notification.create({
          data: {
            userId: user.id,
            title: `💳 ${formattedChannel} Charge: ${parsed.merchant}`,
            message: `A charge of Rs. ${parsed.amount.toLocaleString()} was detected from ${formattedChannel}. Click to review and add to expenses.`,
            type: "WARNING",
            isRead: false,
          },
        })
        return created
      })
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        const duplicate = await db.pendingSyncTransaction.findFirst({
          where: { userId: user.id, sourceFingerprint },
          include: { account: true, suggestedCategory: true },
        })
        if (duplicate) {
          return NextResponse.json({ success: true, duplicate: true, message: "This demo SMS alert was already received", pendingTransaction: duplicate })
        }
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: "Charge detected and recorded for user confirmation",
      pendingTransaction: pendingItem,
    })
  } catch (error: unknown) {
    logError("demo_sync_webhook_failed", error, { requestId: requestId(req) })
    return NextResponse.json(
      { message: "Internal error processing bank sync webhook" },
      { status: 500 }
    )
  }
}
