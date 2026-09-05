"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart3, TrendingUp, DollarSign, Wallet, ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MultiTrendChart } from "@/components/analytics/multi-trend-chart"
import { CategoryBreakdownTable } from "@/components/analytics/category-breakdown-table"
import { PaymentMethodChart } from "@/components/analytics/payment-method-chart"
import { DailySpendingChart } from "@/components/analytics/daily-spending-chart"

export default function AnalyticsPage() {
  const [monthsRange, setMonthsRange] = useState(6)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/analytics?months=${monthsRange}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error("Failed to load analytics", err)
    } finally {
      setLoading(false)
    }
  }, [monthsRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Visual Financial Analytics</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Deep-dive multi-period cash flow trajectories, payment channels, and category concentration
          </p>
        </div>

        {/* Timeframe Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-card border border-border rounded-lg p-1 shadow-sm text-xs">
            <Button
              variant={monthsRange === 3 ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setMonthsRange(3)}
            >
              3 Months
            </Button>
            <Button
              variant={monthsRange === 6 ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setMonthsRange(6)}
            >
              6 Months
            </Button>
            <Button
              variant={monthsRange === 12 ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => setMonthsRange(12)}
            >
              12 Months
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
            className="h-9 gap-1.5 text-xs shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          Aggregating historical records, payment rails, and category matrices...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Period Total Income</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-bold text-foreground">
                    ${data.metrics.totalPeriodIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Avg: ${data.metrics.averageMonthlyIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}/mo
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Period Total Outflow</span>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-bold text-foreground">
                    ${data.metrics.totalPeriodExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Avg: ${data.metrics.averageMonthlyExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}/mo
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Net Retained Surplus</span>
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-xl font-bold ${data.metrics.netPeriodSavings >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {data.metrics.netPeriodSavings >= 0 ? "+" : ""}${data.metrics.netPeriodSavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    Cumulative {monthsRange}-month margin
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Active Timeframe</span>
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-bold text-foreground">
                    {monthsRange} Months
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {data.trends.length} recorded cycles
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow Trajectory Chart */}
          <MultiTrendChart data={data.trends} />

          {/* Category & Payment Method Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <CategoryBreakdownTable
                categories={data.categoryBreakdown}
                totalExpenses={data.metrics.totalPeriodExpenses}
              />
            </div>
            <div className="lg:col-span-5">
              <PaymentMethodChart methods={data.paymentMethods} />
            </div>
          </div>

          {/* Daily spending intensity */}
          <DailySpendingChart data={data.dailySpending} />
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Unable to load financial analytics.
        </div>
      )}
    </div>
  )
}
