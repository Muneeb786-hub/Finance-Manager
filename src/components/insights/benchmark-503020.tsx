"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PieChart, Info } from "lucide-react"
import { Benchmark503020 } from "@/lib/insights"

interface Benchmark503020Props {
  benchmark: Benchmark503020
}

export function Benchmark503020Widget({ benchmark }: Benchmark503020Props) {
  const getStatusBadge = (status: "UNDER" | "BALANCED" | "OVER", type: "needs" | "wants" | "savings") => {
    if (status === "BALANCED") {
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Optimal</Badge>
    }
    if (type === "savings") {
      return status === "UNDER" ? (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Below 20% Goal</Badge>
      ) : (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Above 20%</Badge>
      )
    }
    return status === "OVER" ? (
      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">Over Budget</Badge>
    ) : (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Under Target</Badge>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">50 / 30 / 20 Budget Allocation</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Standard financial guideline: 50% Essential Needs, 30% Discretionary Wants, 20% Savings
            </CardDescription>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Based on ${benchmark.income.toLocaleString("en-US", { minimumFractionDigits: 2 })} Income
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* Visual Stacked Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted/60">
            <div
              style={{ width: `${Math.min(100, benchmark.needs.actualPercentage)}%` }}
              className="bg-sky-500 transition-all duration-500"
              title={`Needs: ${benchmark.needs.actualPercentage}%`}
            />
            <div
              style={{ width: `${Math.min(100, benchmark.wants.actualPercentage)}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`Wants: ${benchmark.wants.actualPercentage}%`}
            />
            <div
              style={{ width: `${Math.min(100, benchmark.savings.actualPercentage)}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Savings: ${benchmark.savings.actualPercentage}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Needs ({benchmark.needs.actualPercentage}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Wants ({benchmark.wants.actualPercentage}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Savings ({benchmark.savings.actualPercentage}%)</span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Needs Column */}
          <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-sky-600 dark:text-sky-400">Needs (50% Target)</span>
              {getStatusBadge(benchmark.needs.status, "needs")}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Actual Spent</span>
                <span className="font-semibold">${benchmark.needs.actual.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target Guideline</span>
                <span className="font-semibold text-muted-foreground">${benchmark.needs.target.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Allocation</span>
                <span className="font-medium">{benchmark.needs.actualPercentage}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-sky-500/10">
              Covers housing, utilities, groceries, transportation, and health essentials.
            </p>
          </div>

          {/* Wants Column */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-amber-600 dark:text-amber-400">Wants (30% Target)</span>
              {getStatusBadge(benchmark.wants.status, "wants")}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Actual Spent</span>
                <span className="font-semibold">${benchmark.wants.actual.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target Guideline</span>
                <span className="font-semibold text-muted-foreground">${benchmark.wants.target.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Allocation</span>
                <span className="font-medium">{benchmark.wants.actualPercentage}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-amber-500/10">
              Covers dining out, entertainment, shopping, hobbies, and discretionary spending.
            </p>
          </div>

          {/* Savings Column */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">Savings (20% Target)</span>
              {getStatusBadge(benchmark.savings.status, "savings")}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Net Saved</span>
                <span className="font-semibold">${benchmark.savings.actual.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target Guideline</span>
                <span className="font-semibold text-muted-foreground">${benchmark.savings.target.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Allocation</span>
                <span className="font-medium">{benchmark.savings.actualPercentage}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-emerald-500/10">
              Net retained funds directed toward debt payoff, emergency reserves, or savings goals.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
