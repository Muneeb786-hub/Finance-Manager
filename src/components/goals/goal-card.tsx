"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Target,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Plus,
  Minus,
  History,
  Edit2,
  Trash2,
  Clock,
} from "lucide-react"

export interface GoalData {
  id: string
  title: string
  category?: string | null
  targetAmount: number
  currentAmount: number
  targetDate?: string | null
  icon: string
  color: string
  notes?: string | null
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED"
  percentage: number
  remaining: number
  monthlyRequired?: number | null
  isComplete: boolean
  contributionCount: number
}

interface GoalCardProps {
  goal: GoalData
  onDeposit: (goal: GoalData) => void
  onWithdraw: (goal: GoalData) => void
  onViewHistory: (goal: GoalData) => void
  onEdit: (goal: GoalData) => void
  onDelete: (goal: GoalData) => void
}

export function GoalCard({
  goal,
  onDeposit,
  onWithdraw,
  onViewHistory,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const displayPercent = Math.min(100, goal.percentage)
  const isCompleted = goal.status === "COMPLETED" || goal.isComplete

  return (
    <Card className="border-border/80 shadow-sm transition-all hover:border-primary/40 hover:shadow-md flex flex-col justify-between">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
              style={{
                backgroundColor: `${goal.color || "#3b82f6"}20`,
                color: goal.color || "#3b82f6",
              }}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Target className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-foreground truncate">
                  {goal.title}
                </h3>
                {goal.category && (
                  <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {goal.category}
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-3 w-3" />
                    Completed
                  </span>
                )}
              </div>
              {goal.notes && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {goal.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(goal)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Edit Goal"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(goal)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Delete Goal"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Balance & Progress */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(goal.currentAmount)}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                of {formatCurrency(goal.targetAmount)}
              </span>
            </div>
            <span className="font-mono text-sm font-semibold text-foreground">
              {goal.percentage}%
            </span>
          </div>

          <Progress
            value={displayPercent}
            indicatorClassName={isCompleted ? "bg-emerald-500" : "bg-primary"}
            className="h-2 bg-muted"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <span>
              {isCompleted
                ? "Target achieved!"
                : `${formatCurrency(goal.remaining)} remaining`}
            </span>
            {goal.targetDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(goal.targetDate)}
              </span>
            )}
          </div>
        </div>

        {/* Estimated monthly requirement pill */}
        {!isCompleted && goal.monthlyRequired && goal.monthlyRequired > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Target Pace:
            </span>
            <span className="font-semibold text-primary">
              {formatCurrency(goal.monthlyRequired)} / month
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            onClick={() => onDeposit(goal)}
            className="flex-1 gap-1.5 h-8 text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Deposit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWithdraw(goal)}
            className="gap-1.5 h-8 text-xs border-border/80"
            disabled={goal.currentAmount <= 0}
            title="Withdraw funds"
          >
            <Minus className="h-3.5 w-3.5" />
            Withdraw
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewHistory(goal)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
            title="Contribution History"
          >
            <History className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
