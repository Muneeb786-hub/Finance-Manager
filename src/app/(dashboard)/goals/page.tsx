"use client"

import * as React from "react"
import { GoalsSummaryHeader } from "@/components/goals/goals-summary-header"
import { GoalCard, GoalData } from "@/components/goals/goal-card"
import { GoalModal } from "@/components/goals/goal-modal"
import { ContributionModal } from "@/components/goals/contribution-modal"
import { GoalHistoryModal } from "@/components/goals/goal-history-modal"
import { GoalDeleteModal } from "@/components/goals/goal-delete-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Plus, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<GoalData[]>([])
  const [summary, setSummary] = React.useState({
    totalTargetAmount: 0,
    totalCurrentAmount: 0,
    overallPercentage: 0,
    activeCount: 0,
    completedCount: 0,
    totalCount: 0,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<"ACTIVE" | "COMPLETED" | "ALL">("ACTIVE")

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = React.useState(false)
  const [editingGoal, setEditingGoal] = React.useState<GoalData | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<GoalData | null>(null)

  const [contributionTarget, setContributionTarget] = React.useState<GoalData | null>(null)
  const [contributionType, setContributionType] = React.useState<"CONTRIBUTION" | "WITHDRAWAL">("CONTRIBUTION")

  const [historyTarget, setHistoryTarget] = React.useState<GoalData | null>(null)

  const fetchGoals = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/goals")
      if (!res.ok) throw new Error("Failed to load savings goals")
      const data = await res.json()
      setGoals(data.goals || [])
      setSummary(data.summary || {
        totalTargetAmount: 0,
        totalCurrentAmount: 0,
        overallPercentage: 0,
        activeCount: 0,
        completedCount: 0,
        totalCount: 0,
      })
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load savings goals")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  // Filter goals by tab
  const filteredGoals = goals.filter((g) => {
    if (statusFilter === "ACTIVE") return g.status === "ACTIVE"
    if (statusFilter === "COMPLETED") return g.status === "COMPLETED"
    return true
  })

  const handleDeposit = (goal: GoalData) => {
    setContributionTarget(goal)
    setContributionType("CONTRIBUTION")
  }

  const handleWithdraw = (goal: GoalData) => {
    setContributionTarget(goal)
    setContributionType("WITHDRAWAL")
  }

  const handleViewHistory = (goal: GoalData) => {
    setHistoryTarget(goal)
  }

  const handleEdit = (goal: GoalData) => {
    setEditingGoal(goal)
    setIsGoalModalOpen(true)
  }

  const handleDelete = (goal: GoalData) => {
    setDeleteTarget(goal)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & KPI Overview */}
      <GoalsSummaryHeader
        summary={summary}
        onAddGoal={() => {
          setEditingGoal(null)
          setIsGoalModalOpen(true)
        }}
      />

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
          Active Goals ({summary.activeCount})
        </button>
        <button
          onClick={() => setStatusFilter("COMPLETED")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            statusFilter === "COMPLETED"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Completed ({summary.completedCount})
        </button>
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            statusFilter === "ALL"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          All ({summary.totalCount})
        </button>
      </div>

      {/* Goals Grid */}
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
      ) : filteredGoals.length === 0 ? (
        <Card className="border-border/80 shadow-sm border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              {statusFilter === "COMPLETED" ? (
                <CheckCircle2 className="h-7 w-7 stroke-[1.5]" />
              ) : (
                <Target className="h-7 w-7 stroke-[1.5]" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {statusFilter === "COMPLETED"
                ? "No completed goals yet"
                : "No active savings goals found"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              {statusFilter === "COMPLETED"
                ? "Keep making deposits to reach your milestone targets and celebrate completions."
                : "Set a new financial target, establish your timeline, and track your progress."}
            </p>
            {statusFilter !== "COMPLETED" && (
              <Button
                onClick={() => {
                  setEditingGoal(null)
                  setIsGoalModalOpen(true)
                }}
                size="sm"
                className="gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onViewHistory={handleViewHistory}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Goal Create/Edit Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false)
          setEditingGoal(null)
        }}
        onSuccess={fetchGoals}
        initialData={editingGoal}
      />

      {/* Deposit / Withdraw Modal */}
      <ContributionModal
        isOpen={!!contributionTarget}
        onClose={() => setContributionTarget(null)}
        onSuccess={fetchGoals}
        goal={contributionTarget}
        defaultType={contributionType}
      />

      {/* History Ledger Modal */}
      <GoalHistoryModal
        isOpen={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        goal={historyTarget}
      />

      {/* Delete Confirmation Modal */}
      <GoalDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={fetchGoals}
        goal={deleteTarget}
      />
    </div>
  )
}
