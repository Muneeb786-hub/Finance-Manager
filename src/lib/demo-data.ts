import { db } from "@/lib/db"
import { addMoney } from "@/lib/decimal"

export async function seedUserDemoData(userId: string) {
  // Ensure default categories exist or retrieve them
  const categories = await db.category.findMany({
    where: { userId },
  })

  let incomeCat = categories.find((c) => c.type === "INCOME" && c.name.toLowerCase().includes("salary"))
  if (!incomeCat) incomeCat = categories.find((c) => c.type === "INCOME")
  
  let rentCat = categories.find((c) => c.name.toLowerCase().includes("rent"))
  let foodCat = categories.find((c) => c.name.toLowerCase().includes("food") || c.name.toLowerCase().includes("grocer"))
  let transportCat = categories.find((c) => c.name.toLowerCase().includes("transport"))
  let billsCat = categories.find((c) => c.name.toLowerCase().includes("bill") || c.name.toLowerCase().includes("utilit"))
  let entertainmentCat = categories.find((c) => c.name.toLowerCase().includes("entertain"))

  // Create accounts if none exist, or fetch primary account
  let accounts = await db.account.findMany({ where: { userId } })
  if (accounts.length === 0) {
    const mainBank = await db.account.create({
      data: {
        userId,
        name: "Main Checking Account",
        type: "BANK_ACCOUNT",
        openingBalance: 3200,
      },
    })
    const cash = await db.account.create({
      data: {
        userId,
        name: "Cash Wallet",
        type: "CASH",
        openingBalance: 250,
      },
    })
    accounts = [mainBank, cash]
  }

  const primaryAccountId = accounts[0].id
  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() // 0-indexed

  // Generate transactions over past 3 months
  const demoTransactions = [
    // Current month
    {
      description: "Monthly Tech Salary",
      amount: 4200,
      type: "INCOME" as const,
      categoryId: incomeCat?.id,
      date: new Date(curYear, curMonth, 1),
      paymentMethod: "DIRECT_DEPOSIT",
      tags: ["salary", "primary"],
    },
    {
      description: "Apartment Rent Payment",
      amount: 1350,
      type: "EXPENSE" as const,
      categoryId: rentCat?.id,
      date: new Date(curYear, curMonth, 2),
      paymentMethod: "BANK_TRANSFER",
      tags: ["housing", "fixed"],
    },
    {
      description: "Weekly Grocery Restock",
      amount: 142.5,
      type: "EXPENSE" as const,
      categoryId: foodCat?.id,
      date: new Date(curYear, curMonth, 5),
      paymentMethod: "DEBIT_CARD",
      tags: ["food", "essentials"],
    },
    {
      description: "High-Speed Internet Fiber",
      amount: 69.99,
      type: "EXPENSE" as const,
      categoryId: billsCat?.id,
      date: new Date(curYear, curMonth, 7),
      paymentMethod: "CREDIT_CARD",
      tags: ["utilities"],
    },
    {
      description: "Metro Commuter Transit Card",
      amount: 85,
      type: "EXPENSE" as const,
      categoryId: transportCat?.id,
      date: new Date(curYear, curMonth, 10),
      paymentMethod: "DIGITAL_WALLET",
      tags: ["transit"],
    },
    {
      description: "Dinner with Friends",
      amount: 68.25,
      type: "EXPENSE" as const,
      categoryId: entertainmentCat?.id,
      date: new Date(curYear, curMonth, 12),
      paymentMethod: "CREDIT_CARD",
      tags: ["social", "dining"],
    },

    // Previous month
    {
      description: "Monthly Tech Salary",
      amount: 4200,
      type: "INCOME" as const,
      categoryId: incomeCat?.id,
      date: new Date(curYear, curMonth - 1, 1),
      paymentMethod: "DIRECT_DEPOSIT",
      tags: ["salary"],
    },
    {
      description: "Apartment Rent Payment",
      amount: 1350,
      type: "EXPENSE" as const,
      categoryId: rentCat?.id,
      date: new Date(curYear, curMonth - 1, 2),
      paymentMethod: "BANK_TRANSFER",
      tags: ["housing"],
    },
    {
      description: "Supermarket Groceries",
      amount: 380.4,
      type: "EXPENSE" as const,
      categoryId: foodCat?.id,
      date: new Date(curYear, curMonth - 1, 15),
      paymentMethod: "DEBIT_CARD",
      tags: ["food"],
    },
    {
      description: "Electric & Power Utility",
      amount: 110.2,
      type: "EXPENSE" as const,
      categoryId: billsCat?.id,
      date: new Date(curYear, curMonth - 1, 18),
      paymentMethod: "BANK_TRANSFER",
      tags: ["utilities"],
    },

    // 2 months ago
    {
      description: "Monthly Tech Salary",
      amount: 4200,
      type: "INCOME" as const,
      categoryId: incomeCat?.id,
      date: new Date(curYear, curMonth - 2, 1),
      paymentMethod: "DIRECT_DEPOSIT",
      tags: ["salary"],
    },
    {
      description: "Apartment Rent Payment",
      amount: 1350,
      type: "EXPENSE" as const,
      categoryId: rentCat?.id,
      date: new Date(curYear, curMonth - 2, 2),
      paymentMethod: "BANK_TRANSFER",
      tags: ["housing"],
    },
    {
      description: "Groceries & Supplies",
      amount: 340,
      type: "EXPENSE" as const,
      categoryId: foodCat?.id,
      date: new Date(curYear, curMonth - 2, 14),
      paymentMethod: "DEBIT_CARD",
      tags: ["food"],
    },
  ]

  for (const tx of demoTransactions) {
    if (tx.categoryId) {
      await db.transaction.create({
        data: {
          userId,
          accountId: primaryAccountId,
          categoryId: tx.categoryId,
          type: tx.type,
          amount: tx.amount,
          date: tx.date,
          description: tx.description,
          paymentMethod: tx.paymentMethod,
          tags: tx.tags,
        },
      })
    }
  }

  // Create active monthly budgets for current month
  if (foodCat) {
    await db.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: foodCat.id,
          month: curMonth + 1,
          year: curYear,
        },
      },
      update: {},
      create: {
        userId,
        categoryId: foodCat.id,
        amount: 450,
        month: curMonth + 1,
        year: curYear,
        alertThreshold: 80,
      },
    })
  }

  if (transportCat) {
    await db.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: transportCat.id,
          month: curMonth + 1,
          year: curYear,
        },
      },
      update: {},
      create: {
        userId,
        categoryId: transportCat.id,
        amount: 150,
        month: curMonth + 1,
        year: curYear,
        alertThreshold: 85,
      },
    })
  }

  // Create savings goals with initial deposits
  const existingGoals = await db.savingsGoal.findMany({ where: { userId } })
  if (existingGoals.length === 0) {
    const emergencyGoal = await db.savingsGoal.create({
      data: {
        userId,
        title: "Emergency Rainy Day Reserve",
        targetAmount: 6000,
        currentAmount: 2400,
        targetDate: new Date(curYear + 1, 5, 1),
        color: "#10b981",
        icon: "shield",
        notes: "3 to 6 months of living expenses buffer",
      },
    })

    await db.goalContribution.create({
      data: {
        userId,
        goalId: emergencyGoal.id,
        amount: 2400,
        type: "CONTRIBUTION",
        note: "Initial emergency fund allocation",
      },
    })

    const vacationGoal = await db.savingsGoal.create({
      data: {
        userId,
        title: "Japan Summer Trip",
        targetAmount: 3500,
        currentAmount: 1100,
        targetDate: new Date(curYear + 1, 7, 15),
        color: "#3b82f6",
        icon: "plane",
        notes: "Flights, hotel, and sightseeing budget",
      },
    })

    await db.goalContribution.create({
      data: {
        userId,
        goalId: vacationGoal.id,
        amount: 1100,
        type: "CONTRIBUTION",
        note: "Early flight ticket savings",
      },
    })
  }

  // Create recurring commitments
  const existingRecurring = await db.recurringTransaction.findMany({ where: { userId } })
  if (existingRecurring.length === 0) {
    if (rentCat) {
      await db.recurringTransaction.create({
        data: {
          userId,
          categoryId: rentCat.id,
          accountId: primaryAccountId,
          type: "EXPENSE",
          amount: 1350,
          description: "Apartment Rent",
          frequency: "MONTHLY",
          startDate: new Date(curYear, curMonth, 1),
          nextRunDate: new Date(curYear, curMonth + 1, 1),
        },
      })
    }

    if (incomeCat) {
      await db.recurringTransaction.create({
        data: {
          userId,
          categoryId: incomeCat.id,
          accountId: primaryAccountId,
          type: "INCOME",
          amount: 4200,
          description: "Monthly Tech Salary",
          frequency: "MONTHLY",
          startDate: new Date(curYear, curMonth, 1),
          nextRunDate: new Date(curYear, curMonth + 1, 1),
        },
      })
    }
  }

  // Seed helpful notifications
  await db.notification.create({
    data: {
      userId,
      type: "SYSTEM_INFO",
      title: "Welcome to your Financial Sandbox!",
      message: "Sample transactions, budgets, and savings goals have been loaded so you can explore all visual analytics.",
    },
  })

  // Mark onboarding complete
  await db.user.update({
    where: { id: userId },
    data: { onboardingComplete: true },
  })

  return { success: true }
}
