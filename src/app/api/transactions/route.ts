import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { TransactionSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
  const skip = (page - 1) * limit

  const search = searchParams.get("search")
  const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null
  const categoryId = searchParams.get("categoryId")
  const accountId = searchParams.get("accountId")
  const paymentMethod = searchParams.get("paymentMethod")
  const tag = searchParams.get("tag")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const minAmount = searchParams.get("minAmount")
  const maxAmount = searchParams.get("maxAmount")
  const sortBy = searchParams.get("sortBy") || "date"
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc"

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(type ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(accountId ? { accountId } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(startDate || endDate
      ? {
          date: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        }
      : {}),
    ...(minAmount || maxAmount
      ? {
          amount: {
            ...(minAmount ? { gte: parseFloat(minAmount) } : {}),
            ...(maxAmount ? { lte: parseFloat(maxAmount) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { category: { name: { contains: search, mode: "insensitive" } } },
            { paymentMethod: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  // Determine sorting orderBy
  let orderBy: any = [{ date: sortOrder }, { createdAt: "desc" }]
  if (sortBy === "amount") {
    orderBy = [{ amount: sortOrder }, { createdAt: "desc" }]
  } else if (sortBy === "type") {
    orderBy = [{ type: sortOrder }, { createdAt: "desc" }]
  } else if (sortBy === "category") {
    orderBy = [{ category: { name: sortOrder } }, { createdAt: "desc" }]
  }

  try {
    const [total, transactions] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, icon: true, color: true, type: true } },
          account: { select: { id: true, name: true, type: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Transactions GET error:", error)
    return NextResponse.json({ message: "Failed to fetch transactions" }, { status: 500 })
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
    const validated = TransactionSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { message: "Invalid transaction data", errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const {
      type,
      amount,
      categoryId,
      accountId,
      date,
      description,
      paymentMethod,
      tags,
      isRecurring = false,
    } = validated.data

    // Verify category belongs to user and matches type
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

    // Optional account ownership verification
    if (accountId) {
      const account = await db.account.findFirst({
        where: { id: accountId, userId },
      })
      if (!account) {
        return NextResponse.json({ message: "Selected account does not exist" }, { status: 400 })
      }
    }

    let txDate = new Date(date)
    const now = new Date()
    if (
      txDate.getUTCFullYear() === now.getUTCFullYear() &&
      txDate.getUTCMonth() === now.getUTCMonth() &&
      txDate.getUTCDate() === now.getUTCDate()
    ) {
      txDate = now
    }
    let recurringId: string | null = null

    if (isRecurring) {
      const nextRun = new Date(txDate)
      nextRun.setMonth(nextRun.getMonth() + 1)

      const recurring = await db.recurringTransaction.create({
        data: {
          userId,
          type,
          amount,
          categoryId,
          accountId: accountId || null,
          description,
          paymentMethod: paymentMethod || "OTHER",
          frequency: "MONTHLY",
          startDate: txDate,
          nextRunDate: nextRun,
          isActive: true,
          isSubscription: true,
        },
      })
      recurringId = recurring.id
    }

    const transaction = await db.transaction.create({
      data: {
        userId,
        type,
        amount,
        categoryId,
        accountId: accountId || null,
        date: txDate,
        description,
        paymentMethod: paymentMethod || "OTHER",
        tags: tags || [],
        isRecurring: Boolean(isRecurring),
        recurringTransactionId: recurringId,
      },
      include: {
        category: true,
        account: true,
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("Transactions POST error:", error)
    return NextResponse.json({ message: "Failed to create transaction" }, { status: 500 })
  }
}
