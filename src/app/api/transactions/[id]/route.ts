import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { TransactionSchema } from "@/lib/validations"

export async function GET(
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
    const transaction = await db.transaction.findFirst({
      where: { id, userId },
      include: {
        category: true,
        account: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Transaction GET error:", error)
    return NextResponse.json({ message: "Failed to fetch transaction" }, { status: 500 })
  }
}

export async function PATCH(
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
    const existing = await db.transaction.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    const body = await req.json()
    const validated = TransactionSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid transaction data", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { type, amount, categoryId, accountId, date, description, paymentMethod, tags } =
      validated.data

    // Check category ownership & type
    const category = await db.category.findFirst({
      where: { id: categoryId, userId },
    })

    if (!category) {
      return NextResponse.json({ message: "Selected category does not exist" }, { status: 400 })
    }

    if (category.type !== type) {
      return NextResponse.json(
        { message: `Category '${category.name}' does not match transaction type ${type}` },
        { status: 400 }
      )
    }

    const updated = await db.transaction.update({
      where: { id },
      data: {
        type,
        amount,
        categoryId,
        accountId: accountId || null,
        date: new Date(date),
        description,
        paymentMethod: paymentMethod || "OTHER",
        tags: tags || [],
      },
      include: {
        category: true,
        account: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Transaction PATCH error:", error)
    return NextResponse.json({ message: "Failed to update transaction" }, { status: 500 })
  }
}

export async function DELETE(
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
    const existing = await db.transaction.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    await db.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    console.error("Transaction DELETE error:", error)
    return NextResponse.json({ message: "Failed to delete transaction" }, { status: 500 })
  }
}
