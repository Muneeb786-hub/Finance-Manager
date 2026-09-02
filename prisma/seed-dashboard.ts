import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDashboard() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@example.com' },
    include: { categories: true, accounts: true },
  })

  if (!user) {
    console.log('Demo user not found, skipping dashboard seed')
    return
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const foodCat = user.categories.find((c) => c.name === 'Food')
  const rentCat = user.categories.find((c) => c.name === 'Rent')
  const billsCat = user.categories.find((c) => c.name === 'Bills')
  const transportCat = user.categories.find((c) => c.name === 'Transport')
  const checkingAcc = user.accounts.find((a) => a.name === 'Primary Checking')
  const creditCard = user.accounts.find((a) => a.name === 'Student Credit Card')

  // 1. Seed Monthly Budgets
  const sampleBudgets = [
    {
      userId: user.id,
      categoryId: foodCat?.id || user.categories[0].id,
      amount: 400.0,
      month: currentMonth,
      year: currentYear,
      alertThreshold: 80,
    },
    {
      userId: user.id,
      categoryId: rentCat?.id || user.categories[0].id,
      amount: 900.0,
      month: currentMonth,
      year: currentYear,
      alertThreshold: 90,
    },
    {
      userId: user.id,
      categoryId: transportCat?.id || user.categories[0].id,
      amount: 100.0,
      month: currentMonth,
      year: currentYear,
      alertThreshold: 80,
    },
    {
      userId: user.id,
      categoryId: billsCat?.id || user.categories[0].id,
      amount: 120.0,
      month: currentMonth,
      year: currentYear,
      alertThreshold: 85,
    },
  ]

  for (const b of sampleBudgets) {
    const existing = await prisma.budget.findFirst({
      where: {
        userId: b.userId,
        categoryId: b.categoryId,
        month: b.month,
        year: b.year,
      },
    })
    if (!existing) {
      await prisma.budget.create({ data: b })
    }
  }

  // 2. Seed Savings Goals
  const sampleGoals = [
    {
      userId: user.id,
      title: 'Emergency Fund',
      targetAmount: 3000.0,
      currentAmount: 1850.0,
      targetDate: new Date(currentYear, currentMonth + 5, 1),
      icon: 'shield',
      color: '#10b981',
      status: 'ACTIVE' as const,
    },
    {
      userId: user.id,
      title: 'Textbooks & Software',
      targetAmount: 600.0,
      currentAmount: 420.0,
      targetDate: new Date(currentYear, currentMonth + 2, 15),
      icon: 'book',
      color: '#6366f1',
      status: 'ACTIVE' as const,
    },
    {
      userId: user.id,
      title: 'New Laptop',
      targetAmount: 1400.0,
      currentAmount: 500.0,
      targetDate: new Date(currentYear, currentMonth + 8, 1),
      icon: 'laptop',
      color: '#06b6d4',
      status: 'ACTIVE' as const,
    },
  ]

  for (const g of sampleGoals) {
    const existing = await prisma.savingsGoal.findFirst({
      where: { userId: g.userId, title: g.title },
    })
    if (!existing) {
      await prisma.savingsGoal.create({ data: g })
    }
  }

  // 3. Seed Recurring Transactions
  const nextDueDate = new Date(now)
  nextDueDate.setDate(nextDueDate.getDate() + 7)

  const sampleRecurring = [
    {
      userId: user.id,
      categoryId: billsCat?.id || user.categories[0].id,
      accountId: checkingAcc?.id,
      type: 'EXPENSE' as const,
      amount: 55.0,
      frequency: 'MONTHLY' as const,
      startDate: new Date(currentYear, currentMonth - 2, 1),
      nextRunDate: nextDueDate,
      description: 'Fiber Internet Subscription',
      isActive: true,
    },
    {
      userId: user.id,
      categoryId: rentCat?.id || user.categories[0].id,
      accountId: checkingAcc?.id,
      type: 'EXPENSE' as const,
      amount: 850.0,
      frequency: 'MONTHLY' as const,
      startDate: new Date(currentYear, currentMonth - 3, 1),
      nextRunDate: new Date(currentYear, currentMonth, 1),
      description: 'Apartment Lease',
      isActive: true,
    },
  ]

  for (const r of sampleRecurring) {
    const existing = await prisma.recurringTransaction.findFirst({
      where: { userId: r.userId, description: r.description },
    })
    if (!existing) {
      await prisma.recurringTransaction.create({ data: r })
    }
  }

  // 4. Seed Educational Financial Insight
  const existingInsight = await prisma.financialInsight.findFirst({
    where: { userId: user.id },
  })

  if (!existingInsight) {
    await prisma.financialInsight.create({
      data: {
        userId: user.id,
        periodStart: new Date(currentYear, currentMonth - 1, 1),
        periodEnd: new Date(currentYear, currentMonth, 0, 23, 59, 59, 999),
        summary: 'Your current monthly surplus is well above 20%. Consider directing excess funds toward your Emergency Fund goal to build a 3-month expense cushion.',
        structuredData: {
          title: 'Healthy Savings Rate Detected',
          takeaway: 'Maintaining a 20% savings buffer helps withstand unexpected expenses without high-interest debt.',
        },
      },
    })
  }

  console.log('Seeded sample dashboard data successfully.')
}

seedDashboard()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect())
