import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const CreateAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(50),
  type: z.enum(["CASH", "BANK_ACCOUNT", "DIGITAL_WALLET", "CREDIT_CARD", "INVESTMENT", "OTHER"]),
  openingBalance: z.coerce.number().default(0),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const accounts = await db.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Accounts GET error:", error)
    return NextResponse.json({ message: "Failed to fetch accounts" }, { status: 500 })
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
    const validated = CreateAccountSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid account data", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const account = await db.account.create({
      data: {
        userId,
        name: validated.data.name,
        type: validated.data.type as any,
        openingBalance: validated.data.openingBalance,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Accounts POST error:", error)
    return NextResponse.json({ message: "Failed to create account" }, { status: 500 })
  }
}
