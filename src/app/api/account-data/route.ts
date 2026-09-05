import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AccountDataWipeSchema } from "@/lib/validations"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const [
      user,
      accounts,
      categories,
      transactions,
      budgets,
      goals,
      contributions,
      recurring,
      insights,
      notifications,
    ] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          preferredCurrency: true,
          timezone: true,
          createdAt: true,
        },
      }),
      db.account.findMany({ where: { userId } }),
      db.category.findMany({ where: { userId } }),
      db.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      db.budget.findMany({ where: { userId } }),
      db.savingsGoal.findMany({ where: { userId } }),
      db.goalContribution.findMany({ where: { userId } }),
      db.recurringTransaction.findMany({ where: { userId } }),
      db.financialInsight.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals: goals,
      goalContributions: contributions,
      recurringTransactions: recurring,
      financialInsights: insights,
      notifications,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="finance_manager_backup_${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Account Data Export GET error:", error)
    return NextResponse.json({ message: "Failed to export account data" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await request.json()
    const validated = AccountDataWipeSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { message: 'Invalid confirmation phrase. Type "DELETE MY DATA" exactly.' },
        { status: 400 }
      )
    }

    // Execute atomic deletion of all financial records
    await db.$transaction([
      db.goalContribution.deleteMany({ where: { userId } }),
      db.savingsGoal.deleteMany({ where: { userId } }),
      db.budget.deleteMany({ where: { userId } }),
      db.transaction.deleteMany({ where: { userId } }),
      db.recurringTransaction.deleteMany({ where: { userId } }),
      db.financialInsight.deleteMany({ where: { userId } }),
      db.notification.deleteMany({ where: { userId } }),
      db.account.deleteMany({ where: { userId } }),
      db.category.deleteMany({ where: { userId, isDefault: false } }),
    ])

    return NextResponse.json({
      message: "All financial data wiped successfully. User profile and default categories retained.",
    })
  } catch (error) {
    console.error("Account Data Wipe DELETE error:", error)
    return NextResponse.json({ message: "Failed to wipe account data" }, { status: 500 })
  }
}
