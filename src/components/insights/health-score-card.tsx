"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, ShieldCheck, AlertTriangle, AlertCircle, ArrowUpRight } from "lucide-react"
import { FinancialHealthScoreResult } from "@/lib/insights"

interface HealthScoreCardProps {
  health: FinancialHealthScoreResult
  monthlyIncome: number
  monthlyExpenses: number
  netFlow: number
  runwayMonths: number
}

export function HealthScoreCard({
  health,
  monthlyIncome,
  monthlyExpenses,
  netFlow,
  runwayMonths,
}: HealthScoreCardProps) {
  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "EXCELLENT":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Excellent (85-100)</Badge>
      case "GOOD":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20">Good (70-84)</Badge>
      case "MODERATE":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20">Moderate (50-69)</Badge>
      case "NEEDS_ATTENTION":
        return <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20">Needs Attention (30-49)</Badge>
      default:
        return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20">Critical (&lt;30)</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500 stroke-emerald-500"
    if (score >= 70) return "text-blue-500 stroke-blue-500"
    if (score >= 50) return "text-amber-500 stroke-amber-500"
    if (score >= 30) return "text-orange-500 stroke-orange-500"
    return "text-rose-500 stroke-rose-500"
  }

  return (
    <Card className="border-border bg-gradient-to-br from-card to-card/60 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold">Financial Health Score</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Multi-factor assessment based on cash flow margins, emergency runway, and budget adherence
            </CardDescription>
          </div>
          <div>{getRatingBadge(health.rating)}</div>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Circular Gauge / Score Display */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="58"
                className="stroke-muted"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="58"
                className={`transition-all duration-1000 ease-out ${getScoreColor(health.score)}`}
                strokeWidth="10"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * health.score) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tracking-tight">{health.score}</span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Out of 100</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground px-2 leading-relaxed">
            {health.summary}
          </p>
        </div>

        {/* Breakdown bars */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border/60 bg-card">
              <span className="text-[11px] text-muted-foreground font-medium block">Savings Rate</span>
              <span className={`text-base font-bold ${health.savingsRate >= 20 ? "text-emerald-500" : health.savingsRate > 0 ? "text-foreground" : "text-rose-500"}`}>
                {health.savingsRate}%
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-card">
              <span className="text-[11px] text-muted-foreground font-medium block">Net Surplus</span>
              <span className={`text-base font-bold ${netFlow >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {netFlow >= 0 ? "+" : ""}${netFlow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-card">
              <span className="text-[11px] text-muted-foreground font-medium block">Burn Rate</span>
              <span className="text-base font-bold text-foreground">
                {health.burnRate}%
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-card">
              <span className="text-[11px] text-muted-foreground font-medium block">Cash Runway</span>
              <span className="text-base font-bold text-foreground">
                {runwayMonths > 0 ? `${runwayMonths.toFixed(1)} mo` : "&lt; 1 mo"}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Savings Rate &amp; Margin</span>
                <span className="font-semibold">{health.breakdown.savingsRateScore} / 35 pts</span>
              </div>
              <Progress value={(health.breakdown.savingsRateScore / 35) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Budget Adherence &amp; Discipline</span>
                <span className="font-semibold">{health.breakdown.budgetAdherenceScore} / 30 pts</span>
              </div>
              <Progress value={(health.breakdown.budgetAdherenceScore / 30) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Fixed Recurring Commitments</span>
                <span className="font-semibold">{health.breakdown.fixedCostRatioScore} / 20 pts</span>
              </div>
              <Progress value={(health.breakdown.fixedCostRatioScore / 20) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Liquid Emergency Reserve</span>
                <span className="font-semibold">{health.breakdown.emergencyRunwayScore} / 15 pts</span>
              </div>
              <Progress value={(health.breakdown.emergencyRunwayScore / 15) * 100} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
