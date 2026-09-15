import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"

const ExportFiltersSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().min(1).optional(),
  accountId: z.string().min(1).optional(),
  paymentMethod: z.string().max(50).optional(),
  tag: z.string().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().finite().min(0).optional(),
  maxAmount: z.coerce.number().finite().min(0).optional(),
  search: z.string().max(200).optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const parsedFilters = ExportFiltersSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsedFilters.success) {
      return NextResponse.json({ message: "Invalid export filters", errors: parsedFilters.error.flatten().fieldErrors }, { status: 400 })
    }
    const filters = parsedFilters.data

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
              ...(filters.startDate ? { gte: filters.startDate } : {}),
              ...(filters.endDate ? { lte: filters.endDate } : {}),
            },
          }
        : {}),
      ...(filters.minAmount !== undefined || filters.maxAmount !== undefined
        ? {
            amount: {
              ...(filters.minAmount !== undefined ? { gte: filters.minAmount } : {}),
              ...(filters.maxAmount !== undefined ? { lte: filters.maxAmount } : {}),
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
