"use client"

import * as React from "react"
import { setActiveCurrency } from "@/lib/utils"

export interface CurrencyOption {
  code: string
  symbol: string
  name: string
  flag: string
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", flag: "🇨🇦" },
]

interface CurrencyContextType {
  currency: string
  setCurrency: (code: string) => void
  format: (amount: number | string) => string
}

const CurrencyContext = React.createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  format: (amount) => `$${amount}`,
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = React.useState<string>("USD")

  React.useEffect(() => {
    // Read stored currency or default to USD
    const stored = localStorage.getItem("preferredCurrency")
    if (stored) {
      setCurrencyState(stored)
      setActiveCurrency(stored)
    } else {
      // Check user setting or default
      fetch("/api/auth/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data?.preferredCurrency) {
            setCurrencyState(data.preferredCurrency)
            setActiveCurrency(data.preferredCurrency)
            localStorage.setItem("preferredCurrency", data.preferredCurrency)
          }
        })
        .catch(() => {})
    }
  }, [])

  const setCurrency = React.useCallback((newCode: string) => {
    setCurrencyState(newCode)
    setActiveCurrency(newCode)
    localStorage.setItem("preferredCurrency", newCode)
    window.dispatchEvent(new Event("currency-change"))

    // Silently update user profile in DB
    fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredCurrency: newCode }),
    }).catch(() => {})
  }, [])

  const format = React.useCallback(
    (amount: number | string) => {
      const num = typeof amount === "string" ? parseFloat(amount) : amount
      if (isNaN(num)) return "0"

      const currObj = SUPPORTED_CURRENCIES.find((c) => c.code === currency)
      const symbol = currObj ? currObj.symbol : `${currency} `

      const hasDecimals = num % 1 !== 0
      const formatted = num.toLocaleString("en-US", {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
      })

      return `${symbol}${formatted}`
    },
    [currency]
  )

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return React.useContext(CurrencyContext)
}
