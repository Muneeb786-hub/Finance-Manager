import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const UpdateAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(50),
  type: z.enum(["CASH", "BANK_ACCOUNT", "DIGITAL_WALLET", "CREDIT_CARD", "INVESTMENT", "OTHER"]),
  openingBalance: z.coerce.number().default(0),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const existing = await db.account.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 })
    }

    const body = await request.json()
    const validated = UpdateAccountSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ errors: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const updated = await db.account.update({
      where: { id },
      data: {
        name: validated.data.name,
        type: validated.data.type as any,
        openingBalance: validated.data.openingBalance,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Account PATCH error:", error)
    return NextResponse.json({ message: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { id } = params

  try {
    const existing = await db.account.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ message: "Account not found" }, { status: 404 })
    }

    // Set accountId to null on associated transactions and recurring transactions
    await db.transaction.updateMany({
      where: { accountId: id },
      data: { accountId: null },
    })

    await db.recurringTransaction.updateMany({
      where: { accountId: id },
      data: { accountId: null },
    })

    await db.account.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Account DELETE error:", error)
    return NextResponse.json({ message: "Failed to delete account" }, { status: 500 })
  }
}
