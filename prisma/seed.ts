import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo database...')

  const demoEmail = 'demo@example.com'
  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  })

  if (!demoUser) {
    const passwordHash = await bcrypt.hash('password123', 12)
    demoUser = await prisma.user.create({
      data: {
        name: 'Alex Morgan',
        email: demoEmail,
        passwordHash,
        preferredCurrency: 'USD',
        timezone: 'America/New_York',
        onboardingComplete: true,
      },
    })
    console.log('Created demo user:', demoUser.email)
  }

  // Seed default income categories
  const incomeCategories = [
    { name: 'Salary', icon: 'briefcase', color: '#10b981' },
    { name: 'Freelance', icon: 'laptop', color: '#06b6d4' },
    { name: 'Scholarship', icon: 'graduation-cap', color: '#6366f1' },
    { name: 'Gift', icon: 'gift', color: '#ec4899' },
    { name: 'Other', icon: 'plus-circle', color: '#64748b' },
  ]

  for (const cat of incomeCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: demoUser.id, name: cat.name, type: 'INCOME' },
    })
    if (!existing) {
      await prisma.category.create({
        data: {
          userId: demoUser.id,
          name: cat.name,
          type: 'INCOME',
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
        },
      })
    }
  }

  // Seed default expense categories
  const expenseCategories = [
    { name: 'Food', icon: 'utensils', color: '#f97316' },
    { name: 'Transport', icon: 'car', color: '#3b82f6' },
    { name: 'Rent', icon: 'home', color: '#8b5cf6' },
    { name: 'Bills', icon: 'receipt', color: '#eab308' },
    { name: 'Education', icon: 'book-open', color: '#14b8a6' },
    { name: 'Shopping', icon: 'shopping-bag', color: '#d946ef' },
    { name: 'Entertainment', icon: 'film', color: '#f43f5e' },
    { name: 'Health', icon: 'activity', color: '#ef4444' },
    { name: 'Other', icon: 'tag', color: '#64748b' },
  ]

  for (const cat of expenseCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: demoUser.id, name: cat.name, type: 'EXPENSE' },
    })
    if (!existing) {
      await prisma.category.create({
        data: {
          userId: demoUser.id,
          name: cat.name,
          type: 'EXPENSE',
          icon: cat.icon,
          color: cat.color,
          isDefault: true,
        },
      })
    }
  }

  // Seed default accounts
  const defaultAccounts = [
    { name: 'Primary Checking', type: 'BANK_ACCOUNT', openingBalance: 2500 },
    { name: 'Cash Wallet', type: 'CASH', openingBalance: 180 },
    { name: 'High-Yield Savings', type: 'BANK_ACCOUNT', openingBalance: 5000 },
    { name: 'Student Credit Card', type: 'CREDIT_CARD', openingBalance: 0 },
  ]

  for (const acc of defaultAccounts) {
    const existing = await prisma.account.findFirst({
      where: { userId: demoUser.id, name: acc.name },
    })
    if (!existing) {
      await prisma.account.create({
        data: {
          userId: demoUser.id,
          name: acc.name,
          type: acc.type as any,
          openingBalance: acc.openingBalance,
        },
      })
    }
  }

  console.log('Database seeding finished successfully.')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
