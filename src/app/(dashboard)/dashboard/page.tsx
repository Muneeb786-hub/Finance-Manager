"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart"
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart"
import { RecentTransactionsWidget } from "@/components/dashboard/recent-transactions-widget"
import { BudgetProgressWidget } from "@/components/dashboard/budget-progress-widget"
import { SavingsGoalsWidget } from "@/components/dashboard/savings-goals-widget"
import { RecurringPreviewWidget } from "@/components/dashboard/recurring-preview-widget"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TransactionModal } from "@/components/transactions/transaction-modal"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { PendingSyncBanner } from "@/components/bank-sync/pending-sync-banner"
import { SimulateSyncModal } from "@/components/bank-sync/simulate-sync-modal"
import { formatCurrency } from "@/lib/utils"
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false)
  const [isSimulateSyncOpen, setIsSimulateSyncOpen] = React.useState(false)
  const [isSeedingDemo, setIsSeedingDemo] = React.useState(false)

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dashboard")
      if (!res.ok) throw new Error("Failed to load dashboard data")
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      console.error(err)
      setError("Unable to load dashboard data. Please refresh or try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleSeedDemo = async () => {
    setIsSeedingDemo(true)
    try {
      const res = await fetch("/api/onboarding/seed-demo", { method: "POST" })
      if (res.ok) {
        await fetchDashboardData()
      }
    } catch (err) {
      console.error("Failed to seed demo data", err)
    } finally {
      setIsSeedingDemo(false)
    }
  }

  const metrics = data?.metrics || {
    totalBalance: 0,
    currentMonthIncome: 0,
    currentMonthExpenses: 0,
    currentMonthNetFlow: 0,
  }

  const isNetSurplus = metrics.currentMonthNetFlow >= 0

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {session?.user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Here is your financial pulse and monthly cash flow overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            className="h-9 w-9 p-0 border-border/80"
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <QuickActions
            onAddTransaction={() => setIsTransactionModalOpen(true)}
            onSimulateBankSync={() => setIsSimulateSyncOpen(true)}
          />
        </div>
      </div>

      {/* Pending Bank / Card Sync Transactions Banner */}
      <PendingSyncBanner onTransactionApproved={fetchDashboardData} />

      {/* Welcome & Sandbox Tour Banner */}
      {(!data?.onboardingComplete || data?.totalTransactionsCount === 0) && (
        <WelcomeBanner
          onStartWizard={() => setIsOnboardingOpen(true)}
          onSeedDemo={handleSeedDemo}
          isSeeding={isSeedingDemo}
        />
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="flex-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Net Worth"
          value={isLoading ? "..." : formatCurrency(metrics.totalBalance)}
          subtitle="Combined accounts and cash balance"
          icon={Wallet}
          variant="default"
        />
        <MetricCard
          title="Monthly Income"
          value={isLoading ? "..." : formatCurrency(metrics.currentMonthIncome)}
          subtitle="Total earned this calendar month"
          icon={ArrowDownLeft}
          variant="income"
        />
        <MetricCard
          title="Monthly Expenses"
          value={isLoading ? "..." : formatCurrency(metrics.currentMonthExpenses)}
          subtitle="Total spent this calendar month"
          icon={ArrowUpRight}
          variant="expense"
        />
        <MetricCard
          title="Net Cash Flow"
          value={isLoading ? "..." : formatCurrency(metrics.currentMonthNetFlow)}
          subtitle={isNetSurplus ? "Net surplus this month" : "Net deficit this month"}
          icon={TrendingUp}
          variant={isNetSurplus ? "income" : "expense"}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CashFlowChart data={data?.monthlyTrends || []} />
        </div>
        <div className="lg:col-span-5">
          <CategoryPieChart data={data?.spendingByCategory || []} />
        </div>
      </div>

      {/* Operational Widgets Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <BudgetProgressWidget budgets={data?.budgets || []} />
        <SavingsGoalsWidget goals={data?.savingsGoals || []} />
        <RecurringPreviewWidget recurring={data?.upcomingRecurring || []} />
      </div>

      {/* Recent Activity */}
      <div>
        <RecentTransactionsWidget transactions={data?.recentTransactions || []} />
      </div>

      {/* Educational takeaway if available */}
      {data?.latestInsight && (
        <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {data.latestInsight.structuredData?.title || data.latestInsight.title || "Financial Observation"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {data.latestInsight.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={() => {
          setIsTransactionModalOpen(false)
          fetchDashboardData()
        }}
      />

      {/* Guided Onboarding Wizard */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false)
          fetchDashboardData()
        }}
        initialName={session?.user?.name || ""}
        initialCurrency={data?.preferredCurrency || "USD"}
      />

      {/* Simulate Bank / Card Sync Modal */}
      <SimulateSyncModal
        isOpen={isSimulateSyncOpen}
        onClose={() => setIsSimulateSyncOpen(false)}
        onSyncTriggered={fetchDashboardData}
      />
    </div>
  )
}
