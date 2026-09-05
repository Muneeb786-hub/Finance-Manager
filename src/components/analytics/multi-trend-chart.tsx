"use client"

import * as React from "react"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface TrendDataPoint {
  month: string
  income: number
  expenses: number
  netSavings: number
  savingsRate: number
}

interface MultiTrendChartProps {
  data: TrendDataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-background/95 p-3 shadow-md backdrop-blur-sm text-xs">
        <p className="font-semibold text-foreground mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function MultiTrendChart({ data }: MultiTrendChartProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const hasData = data && data.some((d) => d.income > 0 || d.expenses > 0)

  return (
    <Card className="border-border shadow-sm flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Cash Flow &amp; Net Margin Trajectory</CardTitle>
            <CardDescription className="text-xs">
              Income, expenses, and net surplus margin trend
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 min-h-[320px]">
        {!isMounted ? (
          <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground">
            Loading trajectory chart...
          </div>
        ) : !hasData ? (
          <div className="flex h-[320px] flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <p className="text-sm font-medium">No trend records available</p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              Record transactions over multiple months to generate historical cash flow analytics.
            </p>
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/40" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
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
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
                />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  type="monotone"
                  dataKey="netSavings"
                  name="Net Margin"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3b82f6" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
