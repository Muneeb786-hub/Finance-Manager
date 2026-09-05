"use client"

import * as React from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface DailySpendingPoint {
  day: number
  date: string
  amount: number
}

interface DailySpendingChartProps {
  data: DailySpendingPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-background/95 p-2.5 shadow-md backdrop-blur-sm text-xs">
        <p className="font-semibold text-foreground mb-1">{payload[0].payload.date}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Expenses:</span>
          <span className="font-mono font-semibold text-foreground">
            {formatCurrency(payload[0].value)}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export function DailySpendingChart({ data }: DailySpendingChartProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const hasData = data && data.some((d) => d.amount > 0)

  return (
    <Card className="border-border shadow-sm flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Daily Spending Velocity</CardTitle>
        <CardDescription className="text-xs">
          Daily expense distribution throughout the current month
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 flex-1 min-h-[260px]">
        {!isMounted ? (
          <div className="flex h-[260px] items-center justify-center text-xs text-muted-foreground">
            Loading daily chart...
          </div>
        ) : !hasData ? (
          <div className="flex h-[260px] flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <p className="text-sm font-medium">No daily expenses recorded</p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              Transactions logged this month will appear as daily volume bars here.
            </p>
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                  className="text-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="amount"
                  fill="#f43f5e"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
