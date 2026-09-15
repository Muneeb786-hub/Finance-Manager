import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { PrismaClient } from "@prisma/client"

const authState = vi.hoisted(() => ({ userId: "" }))
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: authState.userId, email: "integration@example.com" } })),
}))

import { POST as createAsset } from "@/app/api/assets/route"
import { PUT as updateAsset } from "@/app/api/assets/[id]/route"
import { POST as linkDemoAccount } from "@/app/api/bank-sync/linked/route"
import { POST as approveSync } from "@/app/api/bank-sync/[id]/approve/route"
import { POST as processRecurring } from "@/app/api/recurring-transactions/process/route"
import { GET as exportData, DELETE as wipeData } from "@/app/api/account-data/route"
import { POST as createBudget } from "@/app/api/budgets/route"
import { POST as createRecurring } from "@/app/api/recurring-transactions/route"
import { PATCH as updateTransaction } from "@/app/api/transactions/[id]/route"

const database = new PrismaClient()
const runDatabaseTests = process.env.RUN_DATABASE_TESTS === "true"

describe.runIf(runDatabaseTests)("PostgreSQL-backed API integration", () => {
  const marker = `integration-${Date.now()}`
  let firstUserId: string
  let secondUserId: string
  let firstCategoryId: string
  let secondCategoryId: string
  let firstAccountId: string
  let secondAccountId: string

  beforeAll(async () => {
    const first = await database.user.create({ data: { email: `${marker}-one@example.com`, name: "One" } })
    const second = await database.user.create({ data: { email: `${marker}-two@example.com`, name: "Two" } })
    firstUserId = first.id
    secondUserId = second.id
    firstCategoryId = (await database.category.create({ data: { userId: first.id, name: "Food", type: "EXPENSE" } })).id
    secondCategoryId = (await database.category.create({ data: { userId: second.id, name: "Other", type: "EXPENSE", isDefault: true } })).id
    firstAccountId = (await database.account.create({ data: { userId: first.id, name: "Cash", type: "CASH", openingBalance: "10.1000" } })).id
    secondAccountId = (await database.account.create({ data: { userId: second.id, name: "Other Cash", type: "CASH" } })).id
  })

  afterAll(async () => {
    await database.user.deleteMany({ where: { email: { startsWith: marker } } })
    await database.$disconnect()
  })

  it("persists fixed-precision money and rejects cross-user relations", async () => {
    authState.userId = firstUserId
    const createdResponse = await createAsset(new Request("http://localhost/api/assets", {
      method: "POST",
      body: JSON.stringify({ name: "Gold", category: "GOLD", value: 0.1, quantity: 0.00000001 }),
    }))
    expect(createdResponse.status).toBe(201)
    const asset = await createdResponse.json()
    expect((await database.asset.findUniqueOrThrow({ where: { id: asset.id } })).value.toFixed(4)).toBe("0.1000")

    authState.userId = secondUserId
    const updateResponse = await updateAsset(new Request(`http://localhost/api/assets/${asset.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: "Stolen", category: "OTHER", value: 100 }),
    }), { params: Promise.resolve({ id: asset.id }) })
    expect(updateResponse.status).toBe(404)

    const linkResponse = await linkDemoAccount(new Request("http://localhost/api/bank-sync/linked", {
      method: "POST",
      body: JSON.stringify({ provider: "CARD", identifier: "4242", accountId: firstAccountId }),
    }))
    expect(linkResponse.status).toBe(400)

    authState.userId = firstUserId
    const budgetResponse = await createBudget(new Request("http://localhost/api/budgets", {
      method: "POST",
      body: JSON.stringify({ categoryId: secondCategoryId, amount: 100, month: 9, year: 2026 }),
    }))
    expect(budgetResponse.status).toBe(404)

    const recurringResponse = await createRecurring(new Request("http://localhost/api/recurring-transactions", {
      method: "POST",
      body: JSON.stringify({ type: "EXPENSE", amount: 10, categoryId: secondCategoryId, description: "Foreign category", frequency: "MONTHLY", startDate: "2026-09-14" }),
    }))
    expect(recurringResponse.status).toBe(404)

    const transaction = await database.transaction.create({
      data: { userId: firstUserId, type: "EXPENSE", amount: 1, categoryId: firstCategoryId, description: "Ownership edit", date: new Date() },
    })
    const transactionUpdate = await updateTransaction(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ type: "EXPENSE", amount: 1, categoryId: firstCategoryId, accountId: secondAccountId, description: "Ownership edit", date: new Date().toISOString() }),
    }), { params: Promise.resolve({ id: transaction.id }) })
    expect(transactionUpdate.status).toBe(400)
  })

  it("approves a simulated charge exactly once under concurrency", async () => {
    authState.userId = firstUserId
    const pending = await database.pendingSyncTransaction.create({
      data: { userId: firstUserId, merchant: "Demo Merchant", amount: "12.3400", suggestedCategoryId: firstCategoryId, accountId: firstAccountId },
    })
    const request = () => new Request(`http://localhost/api/bank-sync/${pending.id}/approve`, {
      method: "POST",
      body: JSON.stringify({ categoryId: firstCategoryId, accountId: firstAccountId }),
    })
    const responses = await Promise.all([
      approveSync(request(), { params: Promise.resolve({ id: pending.id }) }),
      approveSync(request(), { params: Promise.resolve({ id: pending.id }) }),
    ])
    expect(responses.every((response) => response.ok)).toBe(true)
    expect(await database.transaction.count({ where: { userId: firstUserId, description: "Demo Merchant" } })).toBe(1)

    const rejected = await database.pendingSyncTransaction.create({
      data: { userId: firstUserId, merchant: "Ownership Check", amount: 5, suggestedCategoryId: firstCategoryId },
    })
    const rejectedResponse = await approveSync(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ categoryId: secondCategoryId }),
    }), { params: Promise.resolve({ id: rejected.id }) })
    expect(rejectedResponse.status).toBe(400)
  })

  it("processes a recurring occurrence once and exports then wipes every financial model", async () => {
    authState.userId = firstUserId
    const recurring = await database.recurringTransaction.create({
      data: {
        userId: firstUserId,
        categoryId: firstCategoryId,
        accountId: firstAccountId,
        type: "EXPENSE",
        amount: "25.0000",
        description: "Monthly demo",
        frequency: "MONTHLY",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        nextRunDate: new Date("2026-01-01T00:00:00.000Z"),
      },
    })
    const results = await Promise.all([processRecurring(), processRecurring()])
    expect(results.every((response) => response.ok)).toBe(true)
    expect(await database.transaction.count({ where: { recurringTransactionId: recurring.id } })).toBe(1)

    await database.linkedAccountSync.create({
      data: { userId: firstUserId, accountId: firstAccountId, provider: "CARD", accountName: "Demo Card", identifier: "4242" },
    })
    const exported = await exportData()
    const backup = await exported.json()
    expect(backup.version).toBe(2)
    expect(backup.assets.length).toBeGreaterThan(0)
    expect(backup.pendingSyncTransactions.length).toBeGreaterThan(0)
    expect(backup.linkedAccountSyncs.length).toBeGreaterThan(0)

    const wiped = await wipeData(new Request("http://localhost/api/account-data", {
      method: "DELETE",
      body: JSON.stringify({ confirmationPhrase: "DELETE MY DATA" }),
    }))
    expect(wiped.ok).toBe(true)
    expect(await database.user.findUnique({ where: { id: firstUserId } })).not.toBeNull()
    expect(await database.transaction.count({ where: { userId: firstUserId } })).toBe(0)
    expect(await database.asset.count({ where: { userId: firstUserId } })).toBe(0)
    expect(await database.pendingSyncTransaction.count({ where: { userId: firstUserId } })).toBe(0)
    expect(await database.linkedAccountSync.count({ where: { userId: firstUserId } })).toBe(0)
  })
})
