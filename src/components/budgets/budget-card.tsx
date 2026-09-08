"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { Edit2, Trash2, AlertTriangle, CheckCircle, Flame } from "lucide-react"

export interface BudgetData {
  id: string
  categoryId: string
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
  amount: number
  month: number
  year: number
  alertThreshold: number
  spent: number
  remaining: number
  percent: number
  status: "ON_TRACK" | "APPROACHING" | "OVER_BUDGET"
}

interface BudgetCardProps {
  budget: BudgetData
  onEdit: (budget: BudgetData) => void
  onDelete: (budget: BudgetData) => void
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const displayPercent = Math.min(100, budget.percent)

  const getStatusBadge = () => {
    switch (budget.status) {
      case "OVER_BUDGET":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            <Flame className="h-3 w-3" />
            Over Budget
          </span>
        )
      case "APPROACHING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Near Limit ({budget.alertThreshold}%)
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            On Track
          </span>
        )
    }
  }

  const getIndicatorColor = () => {
    switch (budget.status) {
      case "OVER_BUDGET":
        return "bg-rose-500"
      case "APPROACHING":
        return "bg-amber-500"
      default:
        return "bg-emerald-500"
    }
  }

  return (
    <Card className="border-border/80 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: budget.category?.color || "#10b981" }}
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-foreground truncate">
                {budget.category?.name || "Category"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Limit: {formatCurrency(budget.amount)} / month
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(budget)}
              className="h-8 px-2.5 text-xs gap-1.5 border-border/80 hover:border-primary/50 hover:bg-primary/10 text-foreground font-medium shadow-xs"
              title="Edit Budget Limit"
            >
              <Edit2 className="h-3 w-3 text-primary" />
              Edit Limit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(budget)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete Budget"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar & Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              {formatCurrency(budget.spent)}{" "}
              <span className="text-muted-foreground font-normal">
                spent of {formatCurrency(budget.amount)}
              </span>
            </span>
            <span className="font-mono font-medium text-foreground">
              {budget.percent}%
            </span>
          </div>

          <Progress
            value={displayPercent}
            indicatorClassName={getIndicatorColor()}
            className="h-2 bg-muted"
          />

          <div className="flex items-center justify-between pt-1">
            {getStatusBadge()}
            <span className="text-xs font-medium text-muted-foreground">
              {budget.status === "OVER_BUDGET" ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  +{formatCurrency(budget.spent - budget.amount)} over limit
                </span>
              ) : (
                <span>{formatCurrency(budget.remaining)} left</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
