import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import crypto from "crypto"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    let user = await db.user.findUnique({
      where: { id: userId },
      select: { syncWebhookToken: true },
    })

    // If user does not have a webhook token yet, generate one
    let token = user?.syncWebhookToken
    if (!token) {
      token = crypto.randomBytes(24).toString("hex")
      await db.user.update({
        where: { id: userId },
        data: { syncWebhookToken: token },
      })
    }

    const linkedAccounts = await db.linkedAccountSync.findMany({
      where: { userId },
      include: {
        account: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const host = req.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const webhookUrl = `${protocol}://${host}/api/bank-sync/webhook?token=${token}`

    return NextResponse.json({
      webhookToken: token,
      webhookUrl,
      linkedAccounts,
    })
  } catch (err: any) {
    console.error("Failed to fetch linked accounts:", err)
    return NextResponse.json({ message: "Failed to load linked accounts" }, { status: 500 })
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
    const {
      provider, // e.g. "EASYPAISA", "JAZZCASH", "MEEZAN_BANK", "HBL", "SADAPAY", "NAYAPAY", "CARD"
      accountName,
      identifier, // e.g. "03001234567" or "4242"
      senderId, // e.g. "3737", "8558", "MeezanBank"
      accountId,
    } = body

    if (!provider || !identifier) {
      return NextResponse.json(
        { message: "Provider and account identifier (number/last 4 digits) are required" },
        { status: 400 }
      )
    }

    let targetAccountId = accountId

    // If no existing account linked, auto-create a corresponding account in ledger
    if (!targetAccountId) {
      let accountType: "BANK_ACCOUNT" | "DIGITAL_WALLET" | "CREDIT_CARD" = "BANK_ACCOUNT"
      if (provider === "EASYPAISA" || provider === "JAZZCASH") {
        accountType = "DIGITAL_WALLET"
      } else if (provider === "CARD" || provider === "SADAPAY" || provider === "NAYAPAY") {
        accountType = "CREDIT_CARD"
      }

      const defaultName = accountName || `${provider.replace(/_/g, " ")} (${identifier})`
      const newAcc = await db.account.create({
        data: {
          userId,
          name: defaultName,
          type: accountType,
          openingBalance: 0,
        },
      })
      targetAccountId = newAcc.id
    }

    const linked = await db.linkedAccountSync.create({
      data: {
        userId,
        accountId: targetAccountId,
        provider,
        accountName: accountName || `${provider.replace(/_/g, " ")} (${identifier})`,
        identifier: identifier.trim(),
        senderId: senderId || (provider === "EASYPAISA" ? "3737" : provider === "JAZZCASH" ? "8558" : null),
        isActive: true,
      },
      include: {
        account: true,
      },
    })

    return NextResponse.json(linked, { status: 201 })
  } catch (err: any) {
    console.error("Failed to link account:", err)
    return NextResponse.json({ message: "Failed to link account" }, { status: 500 })
  }
}
