import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { db } from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { importFingerprint, parseCsv } from "@/lib/csv-import"

const ImportRequestSchema = z.object({
  csv: z.string().min(1).max(1_000_000),
  confirm: z.boolean().default(false),
})

const RowSchema = z.object({
  type: z.string().transform((value) => value.toUpperCase()).pipe(z.enum(["INCOME", "EXPENSE"])),
  amount: z.coerce.number().finite().positive(),
  date: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date"),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1).max(300),
  account: z.string().trim().optional(),
  paymentmethod: z.string().trim().optional(),
  tags: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const body = ImportRequestSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ message: "Invalid CSV import request" }, { status: 400 })
  const rows = parseCsv(body.data.csv)
  if (!rows.length || rows.length > 500) {
    return NextResponse.json({ message: "CSV must contain between 1 and 500 data rows" }, { status: 400 })
  }

  const [categories, accounts] = await Promise.all([
    db.category.findMany({ where: { userId } }),
    db.account.findMany({ where: { userId } }),
  ])
  const prepared = rows.map((raw, index) => {
    const parsed = RowSchema.safeParse(raw)
    if (!parsed.success) return { row: index + 2, status: "INVALID" as const, errors: parsed.error.issues.map((issue) => issue.message), raw }
    const category = categories.find((candidate) => candidate.type === parsed.data.type && candidate.name.toLowerCase() === parsed.data.category.toLowerCase())
    const account = parsed.data.account
      ? accounts.find((candidate) => candidate.name.toLowerCase() === parsed.data.account?.toLowerCase())
      : undefined
    const errors = [
      !category ? `Unknown ${parsed.data.type.toLowerCase()} category: ${parsed.data.category}` : null,
      parsed.data.account && !account ? `Unknown account: ${parsed.data.account}` : null,
    ].filter((value): value is string => Boolean(value))
    if (errors.length || !category) return { row: index + 2, status: "INVALID" as const, errors, raw }
    const transaction = {
      userId,
      type: parsed.data.type,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      categoryId: category.id,
      accountId: account?.id || null,
      description: parsed.data.description,
      paymentMethod: parsed.data.paymentmethod || "OTHER",
      tags: parsed.data.tags ? parsed.data.tags.split(/[;|]/).map((tag) => tag.trim()).filter(Boolean) : [],
    }
    return { row: index + 2, status: "READY" as const, errors: [], raw, transaction, fingerprint: importFingerprint(userId, transaction) }
  })

  const fingerprints = prepared.flatMap((row) => row.status === "READY" ? [row.fingerprint] : [])
  const existing = new Set((await db.transaction.findMany({
    where: { userId, importFingerprint: { in: fingerprints } },
    select: { importFingerprint: true },
  })).flatMap((row) => row.importFingerprint ? [row.importFingerprint] : []))
  const seen = new Set<string>()
  const preview = prepared.map((row) => {
    if (row.status !== "READY") return row
    if (existing.has(row.fingerprint) || seen.has(row.fingerprint)) {
      return { ...row, status: "DUPLICATE" as const }
    }
    seen.add(row.fingerprint)
    return row
  })
  const counts = {
    total: preview.length,
    ready: preview.filter((row) => row.status === "READY").length,
    invalid: preview.filter((row) => row.status === "INVALID").length,
    duplicates: preview.filter((row) => row.status === "DUPLICATE").length,
  }

  if (!body.data.confirm) return NextResponse.json({ preview, counts })
  if (counts.invalid > 0) return NextResponse.json({ message: "Resolve invalid rows before importing", preview, counts }, { status: 400 })

  const ready = preview.flatMap((row) => row.status === "READY" ? [{ ...row.transaction, importFingerprint: row.fingerprint }] : [])
  const result = await db.transaction.createMany({ data: ready, skipDuplicates: true })
  return NextResponse.json({ message: `Imported ${result.count} transactions`, imported: result.count, skipped: counts.total - result.count })
}
