"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Repeat, ChevronRight, Clock } from "lucide-react"

interface RecurringItem {
  id: string
  description: string
  amount: number
  frequency: string
  nextRunDate: string
  type: "INCOME" | "EXPENSE"
  category?: {
    name: string
    color: string
  }
}

interface RecurringPreviewWidgetProps {
  recurring: RecurringItem[]
}

export function RecurringPreviewWidget({ recurring }: RecurringPreviewWidgetProps) {
  const formatFrequency = (freq: string) => {
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

  return (
    <Card className="border-border/80 shadow-sm flex flex-col h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Upcoming Recurring</CardTitle>
          <CardDescription className="text-xs">
            Automated bills and scheduled subscriptions
          </CardDescription>
        </div>
        <Link
          href="/recurring"
          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        {!recurring || recurring.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
            <Repeat className="h-8 w-8 mb-2 stroke-[1.5] text-muted-foreground/60" />
            <p className="text-sm font-medium">No recurring schedules</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Set up repeating income or subscriptions to plan ahead.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recurring.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{item.description}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due {formatDate(item.nextRunDate)}
                    </span>
                    <span>•</span>
                    <span>{formatFrequency(item.frequency)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
