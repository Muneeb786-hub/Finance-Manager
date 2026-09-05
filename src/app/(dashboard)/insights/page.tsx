"use client"

import { useState, useEffect, useCallback } from "react"
import { Sparkles, Calendar, RefreshCw, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HealthScoreCard } from "@/components/insights/health-score-card"
import { Benchmark503020Widget } from "@/components/insights/benchmark-503020"
import { ObservationsList } from "@/components/insights/observations-list"
import { MomVariances } from "@/components/insights/mom-variances"
import { SnapshotHistory } from "@/components/insights/snapshot-history"

export default function FinancialInsightsPage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    return { month: d.getMonth() + 1, year: d.getFullYear() }
  })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savingSnapshot, setSavingSnapshot] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/financial-insights?month=${currentDate.month}&year=${currentDate.year}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error("Failed to load insights", err)
    } finally {
      setLoading(false)
    }
  }, [currentDate.month, currentDate.year])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      if (prev.month === 1) return { month: 12, year: prev.year - 1 }
      return { month: prev.month - 1, year: prev.year }
    })
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      if (prev.month === 12) return { month: 1, year: prev.year + 1 }
      return { month: prev.month + 1, year: prev.year }
    })
  }

  const handleSaveSnapshot = async () => {
    try {
      setSavingSnapshot(true)
      const res = await fetch("/api/financial-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentDate.month, year: currentDate.year }),
      })
      if (res.ok) {
        setSuccessMsg("Snapshot saved successfully to your archive!")
        setTimeout(() => setSuccessMsg(null), 4000)
        fetchInsights()
      }
    } catch (err) {
      console.error("Failed to save snapshot", err)
    } finally {
      setSavingSnapshot(false)
    }
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Insights &amp; Analytics</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Automated intelligence analyzing cash flow margins, savings velocity, and budget health
          </p>
        </div>

        {/* Month selector & actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-card border border-border rounded-lg p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-3 min-w-[130px] text-center">
              {monthNames[currentDate.month - 1]} {currentDate.year}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsights}
            disabled={loading}
            className="h-9 gap-1.5 text-xs shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleSaveSnapshot}
            disabled={savingSnapshot || loading}
            className="h-9 gap-1.5 text-xs shadow-sm"
          >
            <BookmarkCheck className="h-3.5 w-3.5" />
            {savingSnapshot ? "Saving..." : "Save Snapshot"}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
          <BookmarkCheck className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          Evaluating spending records, budgets, and recurring liabilities...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Health Score Overview */}
          <HealthScoreCard
            health={data.healthScore}
            monthlyIncome={data.metrics.monthlyIncome}
            monthlyExpenses={data.metrics.monthlyExpenses}
            netFlow={data.metrics.netFlow}
            runwayMonths={
              data.metrics.monthlyExpenses > 0
                ? data.metrics.totalLiquidBalance / data.metrics.monthlyExpenses
                : 0
            }
          />

          {/* Actionable Observations */}
          <ObservationsList observations={data.observations || []} />

          {/* 50 / 30 / 20 Rule Benchmark */}
          <Benchmark503020Widget benchmark={data.benchmark503020} />

          {/* Month-over-Month Category Variances */}
          <MomVariances
            variances={data.momVariances || []}
            monthName={data.period.monthName}
          />

          {/* Historical Saved Snapshots */}
          <SnapshotHistory snapshots={data.savedSnapshots || []} />
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Unable to generate insights. Please verify your connection or try again.
        </div>
      )}
    </div>
  )
}
