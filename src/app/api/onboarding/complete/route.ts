import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { OnboardingSetupSchema } from "@/lib/validations"
import { seedUserDemoData } from "@/lib/demo-data"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const userId = (session.user as any).id

  try {
    const body = await request.json()
    const validated = OnboardingSetupSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ errors: validated.error.flatten().fieldErrors }, { status: 400 })
    }

    const {
      name,
      preferredCurrency,
      timezone,
      initialBalance,
      budgetCategoryId,
      budgetAmount,
      goalTitle,
      goalTargetAmount,
      seedDemoData,
    } = validated.data

    // Update user profile
    await db.user.update({
      where: { id: userId },
      data: {
        name,
        preferredCurrency,
        timezone,
        onboardingComplete: true,
      },
    })

    if (seedDemoData) {
      await seedUserDemoData(userId)
      return NextResponse.json({ message: "Onboarding complete with sandbox demo data!" })
    }

    // Update or establish primary account balance
    if (initialBalance > 0) {
      const existingAccount = await db.account.findFirst({ where: { userId } })
      if (existingAccount) {
        await db.account.update({
          where: { id: existingAccount.id },
          data: { openingBalance: initialBalance },
        })
      } else {
        await db.account.create({
          data: {
            userId,
            name: "Main Account",
            type: "BANK_ACCOUNT",
            openingBalance: initialBalance,
          },
        })
      }
    }

    // Optional initial budget
    if (budgetCategoryId && budgetAmount && budgetAmount > 0) {
      const now = new Date()
      await db.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId: budgetCategoryId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        },
        update: { amount: budgetAmount },
        create: {
          userId,
          categoryId: budgetCategoryId,
          amount: budgetAmount,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          alertThreshold: 80,
        },
      })
    }

    // Optional initial savings goal
    if (goalTitle && goalTargetAmount && goalTargetAmount > 0) {
      await db.savingsGoal.create({
        data: {
          userId,
          title: goalTitle,
          targetAmount: goalTargetAmount,
          currentAmount: 0,
          color: "#10b981",
        },
      })
    }

    // Initial welcome notification
    await db.notification.create({
      data: {
        userId,
        type: "SYSTEM_INFO",
        title: "Setup Complete!",
        message: "Your financial profile and starting ledger have been initialized.",
      },
    })

    return NextResponse.json({ message: "Onboarding successfully completed!" })
  } catch (error) {
    console.error("Onboarding complete error:", error)
    return NextResponse.json({ message: "Failed to complete onboarding" }, { status: 500 })
  }
}
