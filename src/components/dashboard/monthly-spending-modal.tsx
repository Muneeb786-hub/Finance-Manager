"use client"

import * as React from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  BarChart3,
  ChevronRight,
  Sparkles,
} from "lucide-react"

interface SpendingCategory {
  name: string
  value: number
  color: string
  percentage: number
}

interface MonthlySpendingModalProps {
  isOpen: boolean
  onClose: () => void
  monthlyIncome: number
  monthlyExpenses: number
  netFlow: number
  spendingByCategory: SpendingCategory[]
}

export function MonthlySpendingModal({
  isOpen,
  onClose,
  monthlyIncome,
  monthlyExpenses,
  netFlow,
  spendingByCategory = [],
}: MonthlySpendingModalProps) {
  const currentMonthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date())

  const savingsRate =
    monthlyIncome > 0 && netFlow > 0
      ? Math.round((netFlow / monthlyIncome) * 100)
      : 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Monthly Cash Flow & Spending Summary
              </DialogTitle>
              <DialogDescription className="text-xs">
                {currentMonthName} income breakdown and category outflow allocation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Top Cash Flow KPIs */}
          <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-border/80 bg-muted/30 p-3">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                <ArrowDownLeft className="h-3 w-3 text-emerald-500" /> Income
              </span>
              <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(monthlyIncome)}
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-rose-500" /> Outflow
              </span>
              <div className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(monthlyExpenses)}
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-primary" /> Net Flow
              </span>
              <div
                className={`text-sm sm:text-base font-bold ${
                  netFlow >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {netFlow >= 0 ? "+" : ""}
                {formatCurrency(netFlow)}
              </div>
            </div>
          </div>

          {/* Retention & Savings Highlight */}
          {monthlyIncome > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  Savings Retention Rate:{" "}
                  <strong className="text-foreground font-semibold">
                    {savingsRate}% of income retained
                  </strong>
                </span>
              </div>
              <span className="font-mono font-bold text-primary">{savingsRate}%</span>
            </div>
          )}

          {/* Where Your Money Was Spent (Summarized Breakdown) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Where Money Was Spent (Outflow Breakdown)
              </h4>
              <span className="text-[11px] text-muted-foreground font-medium">
                {spendingByCategory.length} categories
              </span>
            </div>

            {spendingByCategory.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl p-4">
                No expense transactions recorded yet for this month.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {spendingByCategory.map((cat, idx) => {
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color || "#10b981" }}
                          />
                          <span className="font-semibold text-foreground truncate">
                            {cat.name}
                          </span>
                        </div>

                        {/* e.g. Rent = $800 (30%) */}
                        <div className="font-medium text-foreground text-right shrink-0">
                          <span className="font-mono font-bold">
                            {formatCurrency(cat.value)}
                          </span>{" "}
                          <span className="text-muted-foreground text-[11px] font-semibold">
                            ({cat.percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Visual progress distribution */}
                      <Progress
                        value={cat.percentage}
                        className="h-1.5 bg-muted"
                        indicatorClassName="bg-primary"
                        style={
                          {
                            "--progress-background": cat.color,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <Link href="/transactions" onClick={onClose}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <Receipt className="h-3.5 w-3.5" />
                All Transactions
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>

            <Link href="/analytics" onClick={onClose}>
              <Button size="sm" className="gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                Deep Dive Analytics
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
