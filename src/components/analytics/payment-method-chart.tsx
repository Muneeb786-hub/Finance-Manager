"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CreditCard, Wallet, Banknote, Smartphone } from "lucide-react"

interface PaymentMethodItem {
  method: string
  amount: number
  percentage: number
}

interface PaymentMethodChartProps {
  methods: PaymentMethodItem[]
}

export function PaymentMethodChart({ methods }: PaymentMethodChartProps) {
  const getMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case "CREDIT_CARD":
        return <CreditCard className="h-4 w-4 text-sky-500" />
      case "DEBIT_CARD":
        return <CreditCard className="h-4 w-4 text-indigo-500" />
      case "CASH":
        return <Banknote className="h-4 w-4 text-emerald-500" />
      case "DIGITAL_WALLET":
        return <Smartphone className="h-4 w-4 text-purple-500" />
      default:
        return <Wallet className="h-4 w-4 text-amber-500" />
    }
  }

  const formatMethodName = (method: string) => {
    return method
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  if (methods.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
          <CardDescription className="text-xs">Channels used for payments</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          No payment method distribution data available.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
        <CardDescription className="text-xs">
          Outflow distribution across payment rails
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        {methods.map((m) => (
          <div
            key={m.method}
            className="p-3 rounded-lg border border-border bg-card/60 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-muted/60 border border-border/50">
                {getMethodIcon(m.method)}
              </div>
              <div>
                <span className="font-semibold text-foreground">{formatMethodName(m.method)}</span>
                <span className="text-[11px] text-muted-foreground block">{m.percentage}% of spending</span>
              </div>
            </div>
            <span className="font-mono font-bold text-foreground">
              ${m.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
