"use client"

import * as React from "react"
import { RecurringSummaryHeader } from "@/components/recurring/recurring-summary-header"
import { RecurringCard, RecurringScheduleData } from "@/components/recurring/recurring-card"
import { RecurringModal } from "@/components/recurring/recurring-modal"
import { RecurringDeleteModal } from "@/components/recurring/recurring-delete-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Repeat, Plus, AlertCircle, PlayCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function RecurringPage() {
  const [schedules, setSchedules] = React.useState<RecurringScheduleData[]>([])
  const [summary, setSummary] = React.useState({
    projectedMonthlyIncome: 0,
    projectedMonthlyExpenses: 0,
    projectedNetCashFlow: 0,
    activeCount: 0,
    pausedCount: 0,
    dueCount: 0,
    totalCount: 0,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [statusFilter, setStatusFilter] = React.useState<"ACTIVE" | "PAUSED" | "ALL">("ACTIVE")

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingSchedule, setEditingSchedule] = React.useState<RecurringScheduleData | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<RecurringScheduleData | null>(null)

  const fetchSchedules = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/recurring-transactions")
      if (!res.ok) throw new Error("Failed to load recurring schedules")
      const data = await res.json()
      setSchedules(data.schedules || [])
      setSummary(data.summary || {
        projectedMonthlyIncome: 0,
        projectedMonthlyExpenses: 0,
        projectedNetCashFlow: 0,
        activeCount: 0,
        pausedCount: 0,
        dueCount: 0,
        totalCount: 0,
      })
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load recurring schedules")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // Filter schedules by tab
  const filteredSchedules = schedules.filter((s) => {
    if (statusFilter === "ACTIVE") return s.isActive && !s.isExpired
    if (statusFilter === "PAUSED") return !s.isActive || s.isExpired
    return true
  })

  // Toggle active/paused
  const handleToggleStatus = async (schedule: RecurringScheduleData) => {
    try {
      const res = await fetch(`/api/recurring-transactions/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      })

      if (!res.ok) throw new Error("Failed to update status")

      toast.success(
        schedule.isActive
          ? `Paused "${schedule.description}"`
          : `Resumed "${schedule.description}"`
      )
      fetchSchedules()
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status")
    }
  }

  // Process due schedules
  const handleProcessDue = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch("/api/recurring-transactions/process", {
        method: "POST",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to process recurring transactions")

      if (data.processedCount === 0) {
        toast.info("No recurring transactions are currently due")
      } else {
        toast.success(data.message)
        fetchSchedules()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process recurring items")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & KPI Overview */}
      <RecurringSummaryHeader
        summary={summary}
        onAddSchedule={() => {
          setEditingSchedule(null)
          setIsModalOpen(true)
        }}
        onProcessDue={handleProcessDue}
        isProcessing={isProcessing}
      />

      {/* Due Bills Alert Banner */}
      {summary.dueCount > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs sm:text-sm text-foreground backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  {summary.dueCount} Recurring Transaction{summary.dueCount === 1 ? "" : "s"} Due
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scheduled items have reached their next run date and are ready to be recorded into your ledger.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleProcessDue}
              disabled={isProcessing}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs shrink-0 gap-1.5 shadow-sm"
            >
              {isProcessing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              Process Now
            </Button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => setStatusFilter("ACTIVE")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            statusFilter === "ACTIVE"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Active Schedules ({summary.activeCount})
        </button>
        <button
          onClick={() => setStatusFilter("PAUSED")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            statusFilter === "PAUSED"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Paused / Expired ({summary.pausedCount})
        </button>
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            statusFilter === "ALL"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          All Schedules ({summary.totalCount})
        </button>
      </div>

      {/* Schedules Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/80 shadow-sm animate-pulse">
              <CardContent className="p-5 space-y-4">
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-2 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card className="border-border/80 shadow-sm border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Repeat className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {statusFilter === "PAUSED"
                ? "No paused or expired schedules"
                : "No recurring schedules established"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              {statusFilter === "PAUSED"
                ? "All your scheduled recurring transactions are currently active."
                : "Automate your periodic bills, rent, subscriptions, and recurring salary deposits."}
            </p>
            {statusFilter !== "PAUSED" && (
              <Button
                onClick={() => {
                  setEditingSchedule(null)
                  setIsModalOpen(true)
                }}
                size="sm"
                className="gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create First Schedule
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedules.map((schedule) => (
            <RecurringCard
              key={schedule.id}
              schedule={schedule}
              onToggleStatus={handleToggleStatus}
              onEdit={(s) => {
                setEditingSchedule(s)
                setIsModalOpen(true)
              }}
              onDelete={(s) => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingSchedule(null)
        }}
        onSuccess={fetchSchedules}
        initialData={editingSchedule}
      />

      {/* Delete Modal */}
      <RecurringDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={fetchSchedules}
        schedule={deleteTarget}
      />
    </div>
  )
}
