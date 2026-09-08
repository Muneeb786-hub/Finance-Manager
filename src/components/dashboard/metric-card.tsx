import * as React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: "up" | "down" | "neutral"
  variant?: "default" | "income" | "expense" | "neutral"
  onClick?: () => void
  href?: string
  actionHint?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  onClick,
  href,
  actionHint,
}: MetricCardProps) {
  const iconColors = {
    default: "bg-primary/10 text-primary",
    income: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    expense: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    neutral: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }

  const isClickable = !!onClick || !!href

  const content = (
    <Card
      onClick={onClick}
      className={cn(
        "border-border/80 shadow-sm transition-all relative overflow-hidden",
        isClickable &&
          "cursor-pointer hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 group select-none"
      )}
    >
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            {isClickable && (
              <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                {actionHint || "View"} <ChevronRight className="h-3 w-3 inline" />
              </span>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
            iconColors[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }

  return content
}

