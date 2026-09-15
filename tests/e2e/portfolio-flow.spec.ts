import { expect, test } from "@playwright/test"
import { generateSync } from "otplib"

test("portfolio finance journey", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const email = `portfolio-${suffix}@example.com`
  const password = "PortfolioPass123!"

  await page.goto("/register")
  await page.getByLabel("Full Name").fill("Portfolio Reviewer")
  await page.getByLabel("Email").fill(email)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: "Get Started" }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })

  const categoriesResponse = await page.request.get("/api/categories")
  expect(categoriesResponse.ok()).toBeTruthy()
  const categories = await categoriesResponse.json()
  const expenseCategory = categories.find((category: { type: string }) => category.type === "EXPENSE")

  const transactionResponse = await page.request.post("/api/transactions", {
    data: {
      type: "EXPENSE",
      amount: 42.125,
      categoryId: expenseCategory.id,
      date: new Date().toISOString(),
      description: "Portfolio test purchase",
      paymentMethod: "CARD",
      tags: ["e2e"],
    },
  })
  expect(transactionResponse.status()).toBe(201)

  const now = new Date()
  const budgetResponse = await page.request.post("/api/budgets", {
    data: { categoryId: expenseCategory.id, amount: 250, month: now.getMonth() + 1, year: now.getFullYear(), alertThreshold: 80 },
  })
  expect(budgetResponse.ok()).toBeTruthy()

  const syncResponse = await page.request.post("/api/bank-sync", {
    data: { merchant: "Demo Coffee", amount: 12.5, channel: "CARD" },
  })
  expect(syncResponse.status()).toBe(201)
  const pending = await syncResponse.json()
  const approvalResponse = await page.request.post(`/api/bank-sync/${pending.id}/approve`, {
    data: { categoryId: expenseCategory.id },
  })
  expect(approvalResponse.ok()).toBeTruthy()

  const setupResponse = await page.request.post("/api/auth/2fa/setup")
  expect(setupResponse.ok()).toBeTruthy()
  const setup = await setupResponse.json()
  const verifyResponse = await page.request.post("/api/auth/2fa/verify", {
    data: { secret: setup.secret, code: generateSync({ secret: setup.secret }) },
  })
  expect(verifyResponse.ok(), await verifyResponse.text()).toBeTruthy()

  const exportResponse = await page.request.get("/api/account-data")
  expect(exportResponse.ok()).toBeTruthy()
  const backup = await exportResponse.json()
  expect(backup.version).toBe(2)
  expect(backup.transactions.length).toBeGreaterThanOrEqual(2)
  expect(backup.pendingSyncTransactions).toHaveLength(1)

  const wipeResponse = await page.request.delete("/api/account-data", {
    data: { confirmationPhrase: "DELETE MY DATA" },
  })
  expect(wipeResponse.ok()).toBeTruthy()
  const afterWipe = await page.request.get("/api/account-data")
  const emptyBackup = await afterWipe.json()
  expect(emptyBackup.transactions).toHaveLength(0)
  expect(emptyBackup.assets).toHaveLength(0)
  expect(emptyBackup.pendingSyncTransactions).toHaveLength(0)
})
