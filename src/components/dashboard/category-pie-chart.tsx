"use client"

import * as React from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface CategorySpend {
  name: string
  value: number
  color: string
  percentage: number
}

interface CategoryPieChartProps {
  data: CategorySpend[]
}

const DEFAULT_COLORS = [
  "#f97316",
  "#3b82f6",
  "#8b5cf6",
  "#eab308",
  "#14b8a6",
  "#d946ef",
  "#f43f5e",
  "#10b981",
  "#64748b",
]

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as CategorySpend
    return (
      <div className="rounded-lg border border-border/80 bg-background/95 p-2.5 shadow-md backdrop-blur-sm text-xs">
        <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: data.color || DEFAULT_COLORS[0] }}
          />
          <span>{data.name}</span>
        </div>
        <p className="font-semibold text-foreground">{formatCurrency(data.value)}</p>
        <p className="text-[11px] text-muted-foreground">{data.percentage}% of total expenses</p>
      </div>
    )
  }
  return null
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const hasData = data && data.length > 0 && data.some((d) => d.value > 0)

  return (
    <Card className="border-border/80 shadow-sm flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Spending Breakdown</CardTitle>
        <CardDescription className="text-xs">
          Distribution of expenses for the current month
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 flex-1 flex flex-col justify-center min-h-[300px]">
        {!isMounted ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Loading breakdown...
          </div>
        ) : !hasData ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <p className="text-sm font-medium">No expense records this month</p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              Add expense transactions to see your category spending breakdown.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="h-[220px] w-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 w-full max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {data.map((item, index) => (
                <div
                  key={`item-${index}`}
                  className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                      }}
                    />
                    <span className="truncate font-medium text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {item.percentage}%
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
