"use client"

import * as React from "react"
import { BudgetSummaryHeader } from "@/components/budgets/budget-summary-header"
import { BudgetCard, BudgetData } from "@/components/budgets/budget-card"
import { BudgetModal } from "@/components/budgets/budget-modal"
import { BudgetDeleteModal } from "@/components/budgets/budget-delete-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"
import { PiggyBank, Plus, Copy, AlertCircle, AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function BudgetsPage() {
  const { format } = useCurrency()
  const now = new Date()
  const [currentMonth, setCurrentMonth] = React.useState(now.getMonth() + 1)
  const [currentYear, setCurrentYear] = React.useState(now.getFullYear())

  const [budgets, setBudgets] = React.useState<BudgetData[]>([])
  const [summary, setSummary] = React.useState({
    totalBudgeted: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercent: 0,
    budgetCount: 0,
    onTrackCount: 0,
    approachingCount: 0,
    overBudgetCount: 0,
  })
  const [unbudgetedCategories, setUnbudgetedCategories] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isCopying, setIsCopying] = React.useState(false)

  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [editingBudget, setEditingBudget] = React.useState<BudgetData | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<BudgetData | null>(null)

  const fetchBudgets = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      if (!res.ok) throw new Error("Failed to load budgets")
      const data = await res.json()
      setBudgets(data.budgets || [])
      setSummary(data.summary || {
        totalBudgeted: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercent: 0,
        budgetCount: 0,
        onTrackCount: 0,
        approachingCount: 0,
        overBudgetCount: 0,
      })
      setUnbudgetedCategories(data.unbudgetedCategories || [])
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load budgets for the selected period")
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth, currentYear])

  React.useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const handleCopyPrevious = async () => {
    setIsCopying(true)
    try {
      const res = await fetch("/api/budgets/copy-previous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMonth: currentMonth,
          targetYear: currentYear,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to copy budgets")

      if (data.copiedCount === 0) {
        toast.info(data.message || "No previous budgets found to copy")
      } else {
        toast.success(data.message)
        fetchBudgets()
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to copy budgets")
    } finally {
      setIsCopying(false)
    }
  }

  const handleOpenNewBudget = (prefillCategoryId?: string) => {
    setEditingBudget(null)
    setIsModalOpen(true)
  }

  const handleEditBudget = (budget: BudgetData) => {
    setEditingBudget(budget)
    setIsModalOpen(true)
  }

  const handleDeleteBudget = (budget: BudgetData) => {
    setDeleteTarget(budget)
  }

  const existingCategoryIds = budgets.map((b) => b.categoryId)

  return (
    <div className="space-y-6 pb-12">
      {/* Summary Header with Month Switcher and KPI cards */}
      <BudgetSummaryHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        onMonthChange={(m, y) => {
          setCurrentMonth(m)
          setCurrentYear(y)
        }}
        summary={summary}
        onAddBudget={() => handleOpenNewBudget()}
        onCopyPrevious={handleCopyPrevious}
        isCopying={isCopying}
      />

      {/* Unbudgeted Categories Warning */}
      {unbudgetedCategories.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs sm:text-sm text-foreground backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  Unbudgeted Spending Detected
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You had expenses in {unbudgetedCategories.length} category
                  {unbudgetedCategories.length === 1 ? "" : "ies"} this month without a defined budget limit:{" "}
                  <span className="font-medium text-foreground">
                    {unbudgetedCategories.map((c) => `${c.name} (${format(c.spent)})`).join(", ")}
                  </span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenNewBudget()}
              className="border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs shrink-0"
            >
              Add Budget
            </Button>
          </div>
        </div>
      )}

      {/* Budgets Grid */}
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
      ) : budgets.length === 0 ? (
        <Card className="border-border/80 shadow-sm border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <PiggyBank className="h-7 w-7 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              No budgets established for this month
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Create category spending ceilings or copy your previous month limits to track your progress.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => handleOpenNewBudget()} size="sm" className="gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                Set First Budget
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrevious}
                disabled={isCopying}
                className="gap-1.5 border-border/80"
              >
                {isCopying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
                Copy from Previous Month
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBudget(null)
        }}
        onSuccess={fetchBudgets}
        initialData={editingBudget}
        currentMonth={currentMonth}
        currentYear={currentYear}
        existingCategoryIds={existingCategoryIds}
        allBudgets={budgets}
      />

      <BudgetDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={fetchBudgets}
        budget={deleteTarget}
      />
    </div>
  )
}
