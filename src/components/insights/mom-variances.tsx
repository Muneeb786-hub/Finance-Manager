"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from "lucide-react"
import { MonthOverMonthDiff } from "@/lib/insights"

interface MomVariancesProps {
  variances: MonthOverMonthDiff[]
  monthName: string
}

export function MomVariances({ variances, monthName }: MomVariancesProps) {
  if (variances.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Month-over-Month Spending Shifts</CardTitle>
          <CardDescription>Compare spending velocity with the previous month</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          No category expenditure recorded to compare against the previous period yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold">Month-over-Month Category Shifts</CardTitle>
        </div>
        <CardDescription>
          Detailed variance analysis comparing {monthName} spending against prior month outlays
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left">
                <th className="pb-2.5 font-medium">Category</th>
                <th className="pb-2.5 font-medium text-right">Previous Month</th>
                <th className="pb-2.5 font-medium text-right">Current Month</th>
                <th className="pb-2.5 font-medium text-right">Difference</th>
                <th className="pb-2.5 font-medium text-right">Shift (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {variances.map((v) => (
                <tr key={v.categoryId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: v.color }}
                      />
                      <span className="font-semibold text-foreground">{v.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-muted-foreground">
                    ${v.previousAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono font-medium text-foreground">
                    ${v.currentAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-right font-mono">
                    <span
                      className={
                        v.difference > 0
                          ? "text-rose-500 font-semibold"
                          : v.difference < 0
                          ? "text-emerald-500 font-semibold"
                          : "text-muted-foreground"
                      }
                    >
                      {v.difference > 0 ? `+$${v.difference.toFixed(2)}` : v.difference < 0 ? `-$${Math.abs(v.difference).toFixed(2)}` : "$0.00"}
                    </span>
                  </td>
                  <td className="py-3 pl-2 text-right">
                    {v.trend === "NEW" ? (
                      <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20 text-[10px]">
                        New
                      </Badge>
                    ) : v.trend === "INCREASED" ? (
                      <span className="inline-flex items-center text-rose-500 font-semibold gap-0.5">
                        <ArrowUpRight className="h-3 w-3" />
                        +{v.percentageChange}%
                      </span>
                    ) : v.trend === "DECREASED" ? (
                      <span className="inline-flex items-center text-emerald-500 font-semibold gap-0.5">
                        <ArrowDownRight className="h-3 w-3" />
                        {v.percentageChange}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-muted-foreground gap-0.5">
                        <Minus className="h-3 w-3" />
                        0%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
