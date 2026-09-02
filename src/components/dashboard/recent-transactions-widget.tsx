"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, ChevronRight, Receipt } from "lucide-react"

interface TransactionItem {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  date: string
  description: string
  paymentMethod?: string
  category?: {
    name: string
    color: string
    icon: string
  }
  account?: {
    name: string
  }
}

interface RecentTransactionsWidgetProps {
  transactions: TransactionItem[]
}

export function RecentTransactionsWidget({ transactions }: RecentTransactionsWidgetProps) {
  return (
    <Card className="border-border/80 shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          <CardDescription className="text-xs">
            Latest activity recorded across your accounts
          </CardDescription>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        {!transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
            <Receipt className="h-8 w-8 mb-2 stroke-[1.5] text-muted-foreground/60" />
            <p className="text-sm font-medium">No recent transactions</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Add your first transaction to start tracking activity.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {transactions.map((tx) => {
              const isIncome = tx.type === "INCOME"
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isIncome
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span>{formatDate(tx.date)}</span>
                        {tx.category && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: tx.category.color }}
                              />
                              {tx.category.name}
                            </span>
                          </>
                        )}
                        {tx.account && (
                          <>
                            <span>•</span>
                            <span className="truncate">{tx.account.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
