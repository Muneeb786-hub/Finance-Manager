"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tag } from "lucide-react"

interface CategoryItem {
  name: string
  color: string
  amount: number
  count: number
  percentage: number
}

interface CategoryBreakdownTableProps {
  categories: CategoryItem[]
  totalExpenses: number
}

export function CategoryBreakdownTable({ categories, totalExpenses }: CategoryBreakdownTableProps) {
  if (categories.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
          <CardDescription className="text-xs">Category expenditure breakdown</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          No expense transactions recorded in this timeframe.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Itemized breakdown with volume and percentage share
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Total: ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-semibold text-foreground">{cat.name}</span>
                <span className="text-[11px] text-muted-foreground">({cat.count} tx)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-foreground">
                  ${cat.amount.toFixed(2)}
                </span>
                <span className="text-muted-foreground w-11 text-right font-medium">
                  {cat.percentage}%
                </span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, cat.percentage)}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
