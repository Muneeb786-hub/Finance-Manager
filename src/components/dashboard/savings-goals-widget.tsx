"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Target, ChevronRight, Calendar } from "lucide-react"

interface GoalItem {
  id: string
  title?: string
  name?: string
  targetAmount: number
  currentAmount: number
  targetDate?: string
  percentage: number
  remaining: number
}

interface SavingsGoalsWidgetProps {
  goals: GoalItem[]
}

export function SavingsGoalsWidget({ goals }: SavingsGoalsWidgetProps) {
  return (
    <Card className="border-border/80 shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Savings Goals</CardTitle>
          <CardDescription className="text-xs">
            Targets you are actively accumulating funds toward
          </CardDescription>
        </div>
        <Link
          href="/goals"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        {!goals || goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
            <Target className="h-8 w-8 mb-2 stroke-[1.5] text-muted-foreground/60" />
            <p className="text-sm font-medium">No active savings goals</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Create a financial milestone to monitor your progress.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => {
              const displayPercent = Math.min(100, goal.percentage)
              return (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate">
                      {goal.title || goal.name || "Savings Goal"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(goal.currentAmount)}{" "}
                      <span className="text-muted-foreground font-normal">
                        / {formatCurrency(goal.targetAmount)}
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={displayPercent}
                    indicatorClassName="bg-primary"
                    className="h-1.5 bg-muted"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{goal.percentage}% saved</span>
                    {goal.targetDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Target: {formatDate(goal.targetDate)}
                      </span>
                    )}
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
