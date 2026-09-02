"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { PiggyBank, ChevronRight, AlertTriangle } from "lucide-react"

interface BudgetItem {
  id: string
  amount: number
  spent: number
  remaining: number
  percent: number
  status: "ON_TRACK" | "APPROACHING" | "OVER_BUDGET"
  category: {
    id: string
    name: string
    color: string
  }
}

interface BudgetProgressWidgetProps {
  budgets: BudgetItem[]
}

export function BudgetProgressWidget({ budgets }: BudgetProgressWidgetProps) {
  const getBadgeVariant = (status: BudgetItem["status"]) => {
    switch (status) {
      case "OVER_BUDGET":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      case "APPROACHING":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      default:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    }
  }

  const getStatusLabel = (status: BudgetItem["status"]) => {
    switch (status) {
      case "OVER_BUDGET":
        return "Over Budget"
      case "APPROACHING":
        return "Near Limit"
      default:
        return "On Track"
    }
  }

  const getIndicatorColor = (status: BudgetItem["status"]) => {
    switch (status) {
      case "OVER_BUDGET":
        return "bg-rose-500"
      case "APPROACHING":
        return "bg-amber-500"
      default:
        return "bg-emerald-500"
    }
  }

  return (
    <Card className="border-border/80 shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Budget Status</CardTitle>
          <CardDescription className="text-xs">
            Monthly limits and current consumption
          </CardDescription>
        </div>
        <Link
          href="/budgets"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          Manage
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        {!budgets || budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
            <PiggyBank className="h-8 w-8 mb-2 stroke-[1.5] text-muted-foreground/60" />
            <p className="text-sm font-medium">No active budgets this month</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Set monthly category spending limits to stay on track.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.slice(0, 4).map((b) => {
              const displayPercent = Math.min(100, b.percent)
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: b.category?.color || "#10b981" }}
                      />
                      <span className="font-medium text-foreground truncate">
                        {b.category?.name || "Category"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-medium text-foreground">
                        {formatCurrency(b.spent)}{" "}
                        <span className="text-muted-foreground font-normal">
                          / {formatCurrency(b.amount)}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getBadgeVariant(
                          b.status
                        )}`}
                      >
                        {getStatusLabel(b.status)}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={displayPercent}
                    indicatorClassName={getIndicatorColor(b.status)}
                    className="h-1.5 bg-muted"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{b.percent}% spent</span>
                    <span>
                      {b.status === "OVER_BUDGET"
                        ? `${formatCurrency(b.spent - b.amount)} over`
                        : `${formatCurrency(b.remaining)} remaining`}
                    </span>
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
