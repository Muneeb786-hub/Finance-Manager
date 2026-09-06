"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Repeat,
  Calendar,
  Clock,
  Play,
  Pause,
  Edit2,
  Trash2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react"

export interface RecurringScheduleData {
  id: string
  type: "INCOME" | "EXPENSE"
  amount: number
  description: string
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
  startDate: string
  nextRunDate: string
  endDate?: string | null
  isActive: boolean
  isDue: boolean
  isExpired: boolean
  monthlyAmount: number
  paymentMethod?: string | null
  isSubscription?: boolean
  subcategory?: string | null
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
  account?: {
    id: string
    name: string
  } | null
}

interface RecurringCardProps {
  schedule: RecurringScheduleData
  onToggleStatus: (schedule: RecurringScheduleData) => void
  onEdit: (schedule: RecurringScheduleData) => void
  onDelete: (schedule: RecurringScheduleData) => void
}

export function RecurringCard({
  schedule,
  onToggleStatus,
  onEdit,
  onDelete,
}: RecurringCardProps) {
  const isIncome = schedule.type === "INCOME"

  const formatFreq = (freq: string) => {
    switch (freq) {
      case "DAILY":
        return "Daily"
      case "WEEKLY":
        return "Weekly"
      case "MONTHLY":
        return "Monthly"
      case "YEARLY":
        return "Yearly"
      default:
        return freq
    }
  }

  const getStatusBadge = () => {
    if (schedule.isExpired) {
      return (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
          Expired
        </span>
      )
    }
    if (!schedule.isActive) {
      return (
        <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/80">
          Paused
        </span>
      )
    }
    if (schedule.isDue) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
          <AlertCircle className="h-3 w-3" />
          Due Now
        </span>
      )
    }
    return (
      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    )
  }

  return (
    <Card className="border-border/80 shadow-sm transition-all hover:border-primary/40 hover:shadow-md flex flex-col justify-between">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isIncome
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isIncome ? (
                <ArrowDownLeft className="h-5 w-5" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-foreground truncate">
                {schedule.description}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: schedule.category?.color || "#10b981" }}
                  />
                  {schedule.category?.name}
                </span>
                {schedule.isSubscription && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                      {schedule.subcategory || "Subscription"}
                    </span>
                  </>
                )}
                {schedule.account && (
                  <>
                    <span>•</span>
                    <span className="truncate">{schedule.account.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(schedule)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Edit Schedule"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(schedule)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Delete Schedule"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Amount & Frequency */}
        <div className="flex items-baseline justify-between border-t border-b border-border/40 py-3">
          <div>
            <span
              className={`text-xl font-bold tracking-tight ${
                isIncome
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              }`}
            >
              {isIncome ? "+" : "-"}
              {formatCurrency(schedule.amount)}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">
              / {formatFreq(schedule.frequency).toLowerCase()}
            </span>
          </div>

          <span className="text-xs font-mono text-muted-foreground">
            ~{formatCurrency(schedule.monthlyAmount)} / mo
          </span>
        </div>

        {/* Status & Next Execution */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Next: {formatDate(schedule.nextRunDate)}</span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(schedule)}
            className="h-8 text-xs gap-1.5 border-border/80 w-full"
          >
            {schedule.isActive ? (
              <>
                <Pause className="h-3.5 w-3.5 text-amber-500" />
                Pause Schedule
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-emerald-500" />
                Resume Schedule
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
