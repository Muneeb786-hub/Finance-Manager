"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  SubscriptionModal,
  SubscriptionData,
} from "@/components/subscriptions/subscription-modal"
import { RecurringDeleteModal } from "@/components/recurring/recurring-delete-modal"
import {
  Sparkles,
  Plus,
  Repeat,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Pencil,
  Loader2,
  TrendingUp,
  Flame,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import {
  POPULAR_SUBSCRIPTION_PRESETS,
  SUBSCRIPTION_SUBCATEGORIES,
  getSubcategoryMeta,
  SubscriptionPreset,
} from "@/lib/subscription-presets"

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionData[]>([])
  const [summary, setSummary] = React.useState({
    monthlySubscriptionTotal: 0,
    annualSubscriptionTotal: 0,
    activeCount: 0,
    pausedCount: 0,
    totalCount: 0,
    subcategoryBreakdown: {} as Record<string, { totalMonthly: number; count: number }>,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "PAUSED">("ALL")

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingSub, setEditingSub] = React.useState<SubscriptionData | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<SubscriptionData | null>(null)
  const [prefilledPreset, setPrefilledPreset] = React.useState<SubscriptionPreset | null>(null)

  const fetchSubscriptions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/recurring-transactions?isSubscription=true")
      if (!res.ok) throw new Error("Failed to load subscriptions")
      const data = await res.json()

      const subs: SubscriptionData[] = data.schedules || []
      setSubscriptions(subs)

      const activeSubs = subs.filter((s) => s.isActive && !s.isExpired)
      const pausedSubs = subs.filter((s) => !s.isActive || s.isExpired)

      setSummary({
        monthlySubscriptionTotal: data.summary?.monthlySubscriptionTotal || 0,
        annualSubscriptionTotal: data.summary?.annualSubscriptionTotal || 0,
        activeCount: activeSubs.length,
        pausedCount: pausedSubs.length,
        totalCount: subs.length,
        subcategoryBreakdown: data.summary?.subcategoryBreakdown || {},
      })
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load subscriptions")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (statusFilter === "ACTIVE" && (!sub.isActive || sub.isExpired)) return false
    if (statusFilter === "PAUSED" && sub.isActive && !sub.isExpired) return false
    if (selectedSubcategory !== "ALL") {
      const currentCat = sub.subcategory || "Other"
      if (currentCat.toLowerCase() !== selectedSubcategory.toLowerCase()) return false
    }
    return true
  })

  // Toggle active/paused status
  const handleToggleStatus = async (sub: SubscriptionData) => {
    try {
      const res = await fetch(`/api/recurring-transactions/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !sub.isActive }),
      })

      if (!res.ok) throw new Error("Failed to update status")

      toast.success(
        sub.isActive ? `Paused "${sub.description}"` : `Resumed "${sub.description}"`
      )
      fetchSubscriptions()
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    }
  }

  // Calculate days remaining until renewal
  const getDaysUntilRenewal = (nextRunDate: string | Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const renewal = new Date(nextRunDate)
    renewal.setHours(0, 0, 0, 0)
    const diffTime = renewal.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const openAddModalWithPreset = (preset: SubscriptionPreset) => {
    setEditingSub(null)
    setPrefilledPreset(preset)
    setIsModalOpen(true)
  }

  // Find top subcategory
  const topSubcategoryEntry = Object.entries(summary.subcategoryBreakdown).sort(
    (a, b) => b[1].totalMonthly - a[1].totalMonthly
  )[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subscriptions</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-3 w-3" />
              Tracker
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track AI services, streaming, cloud subscriptions, and manage recurring digital burn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEditingSub(null)
              setPrefilledPreset(null)
              setIsModalOpen(true)
            }}
            className="text-xs h-9 shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Subscription
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Monthly Spend</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                ${summary.monthlySubscriptionTotal.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">/mo</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Based on {summary.activeCount} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Annualized Burn</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                ${summary.annualSubscriptionTotal.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">/yr</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Projected 12-month expense
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Services</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                {summary.activeCount}
              </span>
              {summary.pausedCount > 0 && (
                <span className="text-xs text-muted-foreground font-medium">
                  ({summary.pausedCount} paused)
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {summary.totalCount} registered in ledger
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Top Category</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                {topSubcategoryEntry ? getSubcategoryMeta(topSubcategoryEntry[0]).label : "None"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {topSubcategoryEntry
                ? `$${topSubcategoryEntry[1].totalMonthly.toFixed(2)}/mo (${topSubcategoryEntry[1].count} services)`
                : "No active subscriptions"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Presets Strip */}
      <Card className="shadow-xs border-border/70 overflow-hidden">
        <CardHeader className="py-3 px-4 sm:px-5 bg-muted/20 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Popular Subscriptions (1-Click Add)
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">Click to prefill</span>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_SUBSCRIPTION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => openAddModalWithPreset(preset)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-card hover:bg-primary/10 hover:border-primary/40 transition-all border border-border/70 shadow-xs shrink-0 group text-foreground"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: preset.color }}
                />
                <span className="font-semibold">{preset.name}</span>
                <span className="text-[11px] text-muted-foreground group-hover:text-primary font-mono">
                  ${preset.defaultAmount}/mo
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subcategory Spending Distribution Bar */}
      {summary.monthlySubscriptionTotal > 0 && (
        <Card className="shadow-xs border-border/70">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">
                Category Spending Distribution
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Total: ${summary.monthlySubscriptionTotal.toFixed(2)}/mo
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden flex shadow-inner">
              {Object.entries(summary.subcategoryBreakdown).map(([subcat, data]) => {
                const percent =
                  summary.monthlySubscriptionTotal > 0
                    ? (data.totalMonthly / summary.monthlySubscriptionTotal) * 100
                    : 0
                const meta = getSubcategoryMeta(subcat)
                return (
                  <div
                    key={subcat}
                    style={{ width: `${percent}%`, backgroundColor: meta.color }}
                    title={`${meta.label}: $${data.totalMonthly.toFixed(2)} (${percent.toFixed(1)}%)`}
                    className="h-full transition-all duration-300"
                  />
                )
              })}
            </div>

            {/* Legend Chips */}
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-border/50 text-xs">
              {Object.entries(summary.subcategoryBreakdown).map(([subcat, data]) => {
                const meta = getSubcategoryMeta(subcat)
                return (
                  <div key={subcat} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="font-medium text-foreground">{meta.label}:</span>
                    <span className="text-muted-foreground font-mono">
                      ${data.totalMonthly.toFixed(2)}/mo
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Subcategory Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSubcategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedSubcategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Subcategories ({subscriptions.length})
          </button>
          {SUBSCRIPTION_SUBCATEGORIES.map((sub) => {
            const count = subscriptions.filter(
              (s) => (s.subcategory || "Other").toLowerCase() === sub.id.toLowerCase()
            ).length
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubcategory(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedSubcategory.toLowerCase() === sub.id.toLowerCase()
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: sub.color }}
                />
                {sub.label} {count > 0 && <span className="opacity-80">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              statusFilter === "ALL"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              statusFilter === "ACTIVE"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PAUSED")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              statusFilter === "PAUSED"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paused
          </button>
        </div>
      </div>

      {/* Subscriptions Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin mb-2 text-primary" />
          <p className="text-xs">Loading subscriptions...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <Card className="border-dashed border-2 py-12 text-center shadow-xs">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base">No subscriptions found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedSubcategory !== "ALL"
                  ? `No subscriptions categorized under "${selectedSubcategory}". Try selecting another category.`
                  : "Start tracking your digital subscriptions, AI memberships, and streaming services."}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setEditingSub(null)
                  setPrefilledPreset(null)
                  setIsModalOpen(true)
                }}
                className="text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => {
            const meta = getSubcategoryMeta(sub.subcategory)
            const daysLeft = getDaysUntilRenewal(sub.nextRunDate)
            const isPaused = !sub.isActive || sub.isExpired

            return (
              <Card
                key={sub.id}
                className={`transition-all hover:shadow-md border-border/80 flex flex-col justify-between ${
                  isPaused ? "opacity-70 bg-muted/20" : ""
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <h3 className="font-bold text-sm text-foreground truncate">
                          {sub.description}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                          style={{
                            borderColor: `${meta.color}40`,
                            backgroundColor: `${meta.color}15`,
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </span>
                        {sub.account && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {sub.account.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-base text-foreground font-mono">
                        ${sub.amount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {sub.frequency.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {/* Renewal countdown */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Next Renewal</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-foreground">
                        {new Date(sub.nextRunDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {!isPaused && (
                        <span
                          className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            daysLeft <= 3
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              : daysLeft <= 7
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {daysLeft === 0
                            ? "Due today"
                            : daysLeft < 0
                            ? "Overdue"
                            : `In ${daysLeft} days`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(sub)}
                      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                        sub.isActive
                          ? "text-muted-foreground hover:text-amber-500"
                          : "text-primary hover:text-primary/80"
                      }`}
                    >
                      {sub.isActive ? (
                        <>
                          <PauseCircle className="h-3.5 w-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" /> Resume
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSub(sub)
                          setPrefilledPreset(null)
                          setIsModalOpen(true)
                        }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit subscription"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(sub as any)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete subscription"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingSub(null)
          setPrefilledPreset(null)
        }}
        onSuccess={fetchSubscriptions}
        initialData={
          editingSub
            ? editingSub
            : prefilledPreset
            ? {
                id: "",
                description: prefilledPreset.name,
                amount: prefilledPreset.defaultAmount,
                frequency: prefilledPreset.frequency,
                categoryId: "",
                startDate: new Date().toISOString().split("T")[0],
                nextRunDate: new Date().toISOString().split("T")[0],
                isActive: true,
                isSubscription: true,
                subcategory: prefilledPreset.subcategory,
              }
            : null
        }
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <RecurringDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={fetchSubscriptions}
          schedule={deleteTarget as any}
        />
      )}
    </div>
  )
}
