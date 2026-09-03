"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Target, PiggyBank, Sparkles, Plus, CheckCircle2 } from "lucide-react"

interface GoalsSummaryHeaderProps {
  summary: {
    totalTargetAmount: number
    totalCurrentAmount: number
    overallPercentage: number
    activeCount: number
    completedCount: number
    totalCount: number
  }
  onAddGoal: () => void
}

export function GoalsSummaryHeader({ summary, onAddGoal }: GoalsSummaryHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Header title & action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Savings Goals & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Set financial milestones, calculate monthly requirements, and celebrate completions.
          </p>
        </div>

        <div>
          <Button onClick={onAddGoal} size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Target
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {formatCurrency(summary.totalTargetAmount)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Across {summary.activeCount} active {summary.activeCount === 1 ? "goal" : "goals"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Saved
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.totalCurrentAmount)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Accumulated towards targets
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Overall Progress
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {summary.overallPercentage}%
              </p>
              <p className="text-[11px] text-muted-foreground">
                Average funding completion
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Completed Milestones
              </p>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {summary.completedCount} / {summary.totalCount}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Goals reached successfully
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
