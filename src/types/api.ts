import type { Benchmark503020, FinancialHealthScoreResult, FinancialInsightItem, MonthOverMonthDiff } from "@/lib/insights"

export interface CategoryDto { id: string; name: string; type: "INCOME" | "EXPENSE"; icon: string; color: string }
export interface AccountDto { id: string; name: string; type: string; openingBalance?: number }
export interface TransactionDto {
  id: string; type: "INCOME" | "EXPENSE"; amount: number; date: string; description: string
  categoryId: string; accountId?: string | null; paymentMethod?: string | null; tags: string[]; isRecurring?: boolean
  category: CategoryDto; account?: AccountDto | null
}

export interface AnalyticsDto {
  metrics: { totalPeriodIncome: number; totalPeriodExpenses: number; netPeriodSavings: number; averageMonthlyIncome: number; averageMonthlyExpenses: number }
  trends: Array<{ month: string; income: number; expenses: number; netSavings: number; savingsRate: number }>
  categoryBreakdown: Array<{ name: string; color: string; amount: number; count: number; percentage: number }>
  paymentMethods: Array<{ method: string; amount: number; percentage: number }>
  dailySpending: Array<{ day: number; date: string; amount: number }>
}

export interface InsightsDto {
  period: { monthName: string; month: number; year: number }
  metrics: { monthlyIncome: number; monthlyExpenses: number; netFlow: number; totalLiquidBalance: number }
  healthScore: FinancialHealthScoreResult
  benchmark503020: Benchmark503020
  observations: FinancialInsightItem[]
  momVariances: MonthOverMonthDiff[]
  savedSnapshots: Array<{ id: string; summary: string; structuredData: { healthScore?: { score?: number; rating?: string }; [key: string]: unknown }; createdAt: string; periodStart: string; periodEnd: string }>
}

export interface DashboardDto {
  onboardingComplete: boolean; totalTransactionsCount: number; preferredCurrency: string
  metrics: { totalBalance: number; currentMonthIncome: number; currentMonthExpenses: number; currentMonthNetFlow: number }
  monthlyTrends: Array<{ month: string; income: number; expenses: number }>
  spendingByCategory: Array<{ name: string; value: number; color: string; percentage: number }>
  recentTransactions: TransactionDto[]
  budgets: Array<{ id: string; amount: number; spent: number; remaining: number; percent: number; status: "ON_TRACK" | "APPROACHING" | "OVER_BUDGET"; category: CategoryDto }>
  savingsGoals: Array<{ id: string; title: string; targetAmount: number; currentAmount: number; targetDate?: string | null; percentage: number; remaining: number }>
  upcomingRecurring: Array<{ id: string; description: string; amount: number; frequency: string; nextRunDate: string; type: "INCOME" | "EXPENSE"; category?: CategoryDto }>
  latestInsight?: { title?: string; summary: string; structuredData?: { title?: string } } | null
}
