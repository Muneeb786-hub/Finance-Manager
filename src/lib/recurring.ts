import { MoneyValue, multiplyMoney, toDecimal } from "./decimal"

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"

export function advanceNextRunDate(fromDate: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(fromDate)
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1)
      break
    case "WEEKLY":
      next.setDate(next.getDate() + 7)
      break
    case "MONTHLY": {
      const currentDay = next.getDate()
      next.setMonth(next.getMonth() + 1)
      // Handle edge cases like Jan 31 -> Feb 28
      if (next.getDate() !== currentDay && next.getDate() < 5) {
        next.setDate(0) // Last day of previous month
      }
      break
    }
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}

export function calculateMonthlyEquivalent(amount: MoneyValue, frequency: RecurrenceFrequency): number {
  switch (frequency) {
    case "DAILY":
      return Math.round(multiplyMoney(amount, 30) * 100) / 100
    case "WEEKLY":
      return Math.round(multiplyMoney(amount, 52 / 12) * 100) / 100
    case "MONTHLY":
      return toDecimal(amount).toDecimalPlaces(2).toNumber()
    case "YEARLY":
      return Math.round(multiplyMoney(amount, 1 / 12) * 100) / 100
    default:
      return toDecimal(amount).toNumber()
  }
}
