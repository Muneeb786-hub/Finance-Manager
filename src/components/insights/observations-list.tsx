"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Target,
  ArrowRight,
} from "lucide-react"
import { FinancialInsightItem } from "@/lib/insights"

interface ObservationsListProps {
  observations: FinancialInsightItem[]
}

export function ObservationsList({ observations }: ObservationsListProps) {
  const getSeverityBadge = (severity: FinancialInsightItem["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="destructive">High Priority</Badge>
      case "WARNING":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20">Attention</Badge>
      case "POSITIVE":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Positive</Badge>
      default:
        return <Badge variant="secondary">Observation</Badge>
    }
  }

  const getTypeIcon = (type: FinancialInsightItem["type"]) => {
    switch (type) {
      case "BUDGET":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "SAVINGS":
        return <Target className="h-4 w-4 text-emerald-500" />
      case "SPENDING":
        return <TrendingUp className="h-4 w-4 text-sky-500" />
      case "RECURRING":
        return <CreditCard className="h-4 w-4 text-indigo-500" />
      default:
        return <Sparkles className="h-4 w-4 text-primary" />
    }
  }

  if (observations.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
          <h3 className="text-base font-semibold">Everything looks healthy!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            No critical anomalies or over-budget alerts detected for this period.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold">Key Findings &amp; Actionable Guidance</CardTitle>
        </div>
        <CardDescription>
          Personalized educational observations based on your transactions, recurring obligations, and active budgets
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {observations.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-border bg-card/60 hover:bg-muted/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 p-2 rounded-lg bg-muted/60 border border-border/60">
                {getTypeIcon(item.type)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{item.title}</span>
                  {getSeverityBadge(item.severity)}
                  {item.metric && (
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-muted text-foreground">
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                {item.actionSuggestion && (
                  <p className="text-xs font-medium text-primary flex items-center gap-1 mt-1">
                    <ArrowRight className="h-3 w-3" />
                    <span>{item.actionSuggestion}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
