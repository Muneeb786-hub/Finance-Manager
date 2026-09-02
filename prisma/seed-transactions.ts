import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTransactions() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@example.com' },
    include: { categories: true, accounts: true },
  })

  if (!user) {
    console.log('Demo user not found, skipping transactions seed')
    return
  }

  const foodCat = user.categories.find((c) => c.name === 'Food')
  const rentCat = user.categories.find((c) => c.name === 'Rent')
  const transportCat = user.categories.find((c) => c.name === 'Transport')
  const billsCat = user.categories.find((c) => c.name === 'Bills')
  const entertainmentCat = user.categories.find((c) => c.name === 'Entertainment')
  const salaryCat = user.categories.find((c) => c.name === 'Salary')
  const freelanceCat = user.categories.find((c) => c.name === 'Freelance')

  const checkingAcc = user.accounts.find((a) => a.name === 'Primary Checking')
  const creditCardAcc = user.accounts.find((a) => a.name === 'Student Credit Card')
  const cashWallet = user.accounts.find((a) => a.name === 'Cash Wallet')

  const sampleTransactions = [
    {
      userId: user.id,
      type: 'INCOME' as const,
      amount: 3200.0,
      categoryId: salaryCat?.id || user.categories[0].id,
      accountId: checkingAcc?.id,
      date: new Date('2026-09-01T09:00:00Z'),
      description: 'Campus Tech Support Stipend',
      paymentMethod: 'BANK_TRANSFER',
      tags: ['stipend', 'campus'],
    },
    {
      userId: user.id,
      type: 'INCOME' as const,
      amount: 450.0,
      categoryId: freelanceCat?.id || user.categories[0].id,
      accountId: checkingAcc?.id,
      date: new Date('2026-08-28T14:30:00Z'),
      description: 'Web Design Freelance Project',
      paymentMethod: 'DIGITAL_WALLET',
      tags: ['freelance', 'web'],
    },
    {
      userId: user.id,
      type: 'EXPENSE' as const,
      amount: 850.0,
      categoryId: rentCat?.id || user.categories[0].id,
      accountId: checkingAcc?.id,
      date: new Date('2026-09-01T10:00:00Z'),
      description: 'Student Apartment Monthly Rent',
      paymentMethod: 'BANK_TRANSFER',
      tags: ['housing', 'fixed'],
    },
    {
      userId: user.id,
      type: 'EXPENSE' as const,
      amount: 64.25,
      categoryId: foodCat?.id || user.categories[0].id,
      accountId: creditCardAcc?.id,
      date: new Date('2026-09-02T12:15:00Z'),
      description: 'Trader Joe’s weekly groceries',
      paymentMethod: 'CREDIT_CARD',
      tags: ['groceries', 'food'],
    },
    {
      userId: user.id,
      type: 'EXPENSE' as const,
      amount: 14.5,
      categoryId: foodCat?.id || user.categories[0].id,
      accountId: cashWallet?.id,
      date: new Date('2026-09-02T13:45:00Z'),
      description: 'Campus Cafeteria Lunch',
      paymentMethod: 'CASH',
      tags: ['lunch'],
    },
    {
      userId: user.id,
      type: 'EXPENSE' as const,
      amount: 45.0,
      categoryId: transportCat?.id || user.categories[0].id,
      accountId: creditCardAcc?.id,
      date: new Date('2026-08-30T17:20:00Z'),
      description: 'Monthly Subway & Metro Pass',
      paymentMethod: 'CREDIT_CARD',
      tags: ['commute', 'transit'],
    },
    {
      userId: user.id,
      type: 'EXPENSE' as const,
      amount: 55.0,
      categoryId: billsCat?.id || user.categories[0].id,
      accountId: checkingAcc?.id,
      date: new Date('2026-08-27T08:00:00Z'),
      description: 'High-speed Internet Bill',
      paymentMethod: 'BANK_TRANSFER',
      tags: ['utilities'],
    },
    {
      userId: user.id,
      type: 'EXPENSE' as const,
      amount: 19.99,
      categoryId: entertainmentCat?.id || user.categories[0].id,
      accountId: creditCardAcc?.id,
      date: new Date('2026-08-25T19:00:00Z'),
      description: 'Streaming & Media Subscription',
      paymentMethod: 'CREDIT_CARD',
      tags: ['subscription'],
    },
  ]

  for (const t of sampleTransactions) {
    const exists = await prisma.transaction.findFirst({
      where: { userId: user.id, description: t.description, date: t.date },
    })
    if (!exists) {
      await prisma.transaction.create({ data: t })
    }
  }

  console.log(`Seeded ${sampleTransactions.length} sample transactions for demo user.`)
}

seedTransactions()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect())
