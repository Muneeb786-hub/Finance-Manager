import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: "up" | "down" | "neutral"
  variant?: "default" | "income" | "expense" | "neutral"
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: MetricCardProps) {
  const iconColors = {
    default: "bg-primary/10 text-primary",
    income: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    expense: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    neutral: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }

  return (
    <Card className="border-border/80 shadow-sm transition-all hover:border-primary/40">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconColors[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
