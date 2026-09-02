import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const filters = await req.json().catch(() => ({}))

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
      ...(filters.tag ? { tags: { has: filters.tag } } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            date: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
      ...(filters.minAmount || filters.maxAmount
        ? {
            amount: {
              ...(filters.minAmount ? { gte: parseFloat(filters.minAmount) } : {}),
              ...(filters.maxAmount ? { lte: parseFloat(filters.maxAmount) } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { description: { contains: filters.search, mode: "insensitive" } },
              { category: { name: { contains: filters.search, mode: "insensitive" } } },
              { paymentMethod: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: "desc" },
    })

    // Build CSV content
    const headers = ["ID", "Date", "Type", "Category", "Description", "Account", "Payment Method", "Tags", "Amount"]
    const rows = transactions.map((t) => {
      const escape = (val: string | number | null | undefined) => {
        if (val === null || val === undefined) return '""'
        const s = String(val).replace(/"/g, '""')
        return `"${s}"`
      }

      return [
        escape(t.id),
        escape(t.date.toISOString().split("T")[0]),
        escape(t.type),
        escape(t.category?.name || "Uncategorized"),
        escape(t.description),
        escape(t.account?.name || "N/A"),
        escape(t.paymentMethod || "OTHER"),
        escape(t.tags.join("; ")),
        escape(t.amount.toFixed(2)),
      ].join(",")
    })

    const csvContent = [headers.join(","), ...rows].join("\n")

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("CSV Export error:", error)
    return NextResponse.json({ message: "Failed to export CSV" }, { status: 500 })
  }
}
