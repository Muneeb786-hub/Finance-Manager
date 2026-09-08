"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  PiggyBank,
  Wallet,
  TrendingDown,
  Calendar,
  Loader2,
} from "lucide-react"

interface BudgetSummaryHeaderProps {
  currentMonth: number
  currentYear: number
  onMonthChange: (month: number, year: number) => void
  summary: {
    totalBudgeted: number
    totalSpent: number
    totalRemaining: number
    overallPercent: number
    budgetCount: number
    onTrackCount: number
    approachingCount: number
    overBudgetCount: number
  }
  onAddBudget: () => void
  onCopyPrevious: () => void
  isCopying: boolean
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function BudgetSummaryHeader({
  currentMonth,
  currentYear,
  onMonthChange,
  summary,
  onAddBudget,
  onCopyPrevious,
  isCopying,
}: BudgetSummaryHeaderProps) {
  const { format } = useCurrency()
  const handlePrevMonth = () => {
    let m = currentMonth - 1
    let y = currentYear
    if (m < 1) {
      m = 12
      y -= 1
    }
    onMonthChange(m, y)
  }

  const handleNextMonth = () => {
    let m = currentMonth + 1
    let y = currentYear
    if (m > 12) {
      m = 1
      y += 1
    }
    onMonthChange(m, y)
  }

  const handleToday = () => {
    const now = new Date()
    onMonthChange(now.getMonth() + 1, now.getFullYear())
  }

  const isCurrentCalendarMonth =
    new Date().getMonth() + 1 === currentMonth && new Date().getFullYear() === currentYear

  return (
    <div className="space-y-6">
      {/* Top Controls Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Monthly Budgets
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Set and monitor category limits to keep your spending disciplined.
          </p>
        </div>

        {/* Month Navigator & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Switcher */}
          <div className="flex items-center rounded-lg border border-border/80 bg-card p-0.5 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-3 text-xs sm:text-sm font-semibold min-w-[130px] text-center">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isCurrentCalendarMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-xs h-9 border-border/80"
            >
              Current Month
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onCopyPrevious}
            disabled={isCopying}
            className="text-xs h-9 gap-1.5 border-border/80"
            title="Copy previous month budgets into this month"
          >
            {isCopying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            Copy Previous
          </Button>

          <Button onClick={onAddBudget} size="sm" className="text-xs h-9 gap-1.5 shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            Set Budget
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Budgeted
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {format(summary.totalBudgeted)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {summary.budgetCount} category {summary.budgetCount === 1 ? "budget" : "budgets"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PiggyBank className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Spent
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {format(summary.totalSpent)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {summary.overallPercent}% of total allocation
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Remaining Buffer
              </p>
              <p
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  summary.totalSpent > summary.totalBudgeted
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {format(summary.totalRemaining)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {summary.totalSpent > summary.totalBudgeted
                  ? "Overall budget exceeded"
                  : "Unspent monthly budget"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Health Status
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {summary.overBudgetCount > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    {summary.overBudgetCount} Over Limit
                  </span>
                ) : summary.approachingCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    {summary.approachingCount} Warning
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">All Good</span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {summary.onTrackCount} on track, {summary.approachingCount} near limit
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
