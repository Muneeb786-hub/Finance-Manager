"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import {
  Repeat,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Plus,
  PlayCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface RecurringSummaryHeaderProps {
  summary: {
    projectedMonthlyIncome: number
    projectedMonthlyExpenses: number
    projectedNetCashFlow: number
    activeCount: number
    pausedCount: number
    dueCount: number
    totalCount: number
  }
  onAddSchedule: () => void
  onProcessDue: () => void
  isProcessing: boolean
}

export function RecurringSummaryHeader({
  summary,
  onAddSchedule,
  onProcessDue,
  isProcessing,
}: RecurringSummaryHeaderProps) {
  const isNetPositive = summary.projectedNetCashFlow >= 0

  return (
    <div className="space-y-6">
      {/* Title & Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Recurring & Automation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage scheduled income, recurring subscriptions, and automated ledger postings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {summary.dueCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onProcessDue}
              disabled={isProcessing}
              className="border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1.5 h-9"
              title="Process all due recurring schedules into your ledger"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 text-amber-500" />
              )}
              Process Due ({summary.dueCount})
            </Button>
          )}

          <Button onClick={onAddSchedule} size="sm" className="gap-1.5 h-9 shadow-sm">
            <Plus className="h-4 w-4" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Monthly Recurring In
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.projectedMonthlyIncome)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Normalized monthly income
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Monthly Recurring Out
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {formatCurrency(summary.projectedMonthlyExpenses)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Normalized monthly bills & fees
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Net Recurring Flow
              </p>
              <p
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  isNetPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {formatCurrency(summary.projectedNetCashFlow)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isNetPositive ? "Projected monthly surplus" : "Projected monthly deficit"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Schedules
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {summary.activeCount}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  / {summary.totalCount}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {summary.dueCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {summary.dueCount} due for posting
                  </span>
                ) : (
                  <span>{summary.pausedCount} paused schedules</span>
                )}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Repeat className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
