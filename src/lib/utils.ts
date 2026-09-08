import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PKR: "₨",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  SAR: "SAR ",
  INR: "₹",
  CAD: "CA$",
  AUD: "AU$",
  JPY: "¥",
}

let activeCurrency = "USD"

export function setActiveCurrency(code: string) {
  if (code) activeCurrency = code
}

/**
 * Formats a number with comma separators (e.g. 65000 -> ₨65,000 or $65,000).
 * Never appends verbose trailing words.
 */
export function formatCurrency(amount: number | string, customCurrency?: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(num)) return "$0"

  let currency = customCurrency
  if (!currency && typeof window !== "undefined") {
    try {
      currency = localStorage.getItem("preferredCurrency") || activeCurrency
    } catch {
      currency = activeCurrency
    }
  }
  if (!currency) currency = activeCurrency

  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? (currency + " ")

  const hasDecimals = num % 1 !== 0
  const formattedNum = num.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })

  return `${symbol}${formattedNum}`
}

/**
 * Formats a plain number with commas (e.g. 65000 -> "65,000").
 */
export function formatNumber(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(num)) return "0"
  const hasDecimals = num % 1 !== 0
  return num.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}
