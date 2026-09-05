import { addMoney, subtractMoney, calculatePercentage, toDecimal } from "./decimal"
import Decimal from "decimal.js"

export interface CategorySummary {
  categoryId: string
  name: string
  color: string
  amount: number
  percentage?: number
}

export interface MonthOverMonthDiff {
  categoryId: string
  name: string
  color: string
  currentAmount: number
  previousAmount: number
  difference: number
  percentageChange: number
  trend: "INCREASED" | "DECREASED" | "NEW" | "ZERO"
}

export interface Benchmark503020 {
  income: number
  needs: {
    actual: number
    target: number
    actualPercentage: number
    targetPercentage: 50
    variance: number
    status: "UNDER" | "BALANCED" | "OVER"
  }
  wants: {
    actual: number
    target: number
    actualPercentage: number
    targetPercentage: 30
    variance: number
    status: "UNDER" | "BALANCED" | "OVER"
  }
  savings: {
    actual: number
    target: number
    actualPercentage: number
    targetPercentage: 20
    variance: number
    status: "UNDER" | "BALANCED" | "OVER"
  }
}

export interface FinancialInsightItem {
  id: string
  type: "SAVINGS" | "BUDGET" | "SPENDING" | "RECURRING" | "HEALTH"
  severity: "POSITIVE" | "INFO" | "WARNING" | "CRITICAL"
  title: string
  description: string
  metric?: string
  actionSuggestion?: string
}

export interface FinancialHealthScoreResult {
  score: number // 0 - 100
  rating: "EXCELLENT" | "GOOD" | "MODERATE" | "NEEDS_ATTENTION" | "CRITICAL"
  savingsRate: number
  burnRate: number
  breakdown: {
    savingsRateScore: number // max 35
    budgetAdherenceScore: number // max 30
    fixedCostRatioScore: number // max 20
    emergencyRunwayScore: number // max 15
  }
  summary: string
}

/**
 * Calculates month-over-month category spending changes
 */
export function calculateMonthOverMonthVariances(
  currentExpenses: CategorySummary[],
  previousExpenses: CategorySummary[]
): MonthOverMonthDiff[] {
  const prevMap = new Map<string, CategorySummary>()
  for (const item of previousExpenses) {
    prevMap.set(item.categoryId || item.name.toLowerCase(), item)
  }

  const results: MonthOverMonthDiff[] = []
  const processedKeys = new Set<string>()

  for (const current of currentExpenses) {
    const key = current.categoryId || current.name.toLowerCase()
    processedKeys.add(key)

    const prev = prevMap.get(key)
    const prevAmt = prev ? prev.amount : 0
    const diff = subtractMoney(current.amount, prevAmt)

    let pctChange = 0
    let trend: MonthOverMonthDiff["trend"] = "ZERO"

    if (prevAmt === 0 && current.amount > 0) {
      pctChange = 100
      trend = "NEW"
    } else if (prevAmt > 0) {
      pctChange = new Decimal(diff).dividedBy(prevAmt).times(100).toDecimalPlaces(1).toNumber()
      trend = diff > 0 ? "INCREASED" : diff < 0 ? "DECREASED" : "ZERO"
    }

    results.push({
      categoryId: current.categoryId,
      name: current.name,
      color: current.color || "#10b981",
      currentAmount: current.amount,
      previousAmount: prevAmt,
      difference: diff,
      percentageChange: pctChange,
      trend,
    })
  }

  // Include categories present in previous month but 0 in current
  for (const prev of previousExpenses) {
    const key = prev.categoryId || prev.name.toLowerCase()
    if (!processedKeys.has(key) && prev.amount > 0) {
      results.push({
        categoryId: prev.categoryId,
        name: prev.name,
        color: prev.color || "#6b7280",
        currentAmount: 0,
        previousAmount: prev.amount,
        difference: -prev.amount,
        percentageChange: -100,
        trend: "DECREASED",
      })
    }
  }

  return results.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
}

/**
 * Computes 50/30/20 guideline breakdown from user transactions
 */
export function calculate503020Benchmark(
  monthlyIncome: number,
  needsSpending: number,
  wantsSpending: number,
  savingsAllocated: number
): Benchmark503020 {
  const income = Math.max(0, monthlyIncome)
  const targetNeeds = multiplyMoney(income, 0.5)
  const targetWants = multiplyMoney(income, 0.3)
  const targetSavings = multiplyMoney(income, 0.2)

  const actualNeedsPct = income > 0 ? calculatePercentage(needsSpending, income) : 0
  const actualWantsPct = income > 0 ? calculatePercentage(wantsSpending, income) : 0
  const actualSavingsPct = income > 0 ? calculatePercentage(savingsAllocated, income) : 0

  const getStatus = (actual: number, target: number): "UNDER" | "BALANCED" | "OVER" => {
    const diff = subtractMoney(actual, target)
    if (Math.abs(diff) <= target * 0.08 || target === 0) return "BALANCED"
    return diff > 0 ? "OVER" : "UNDER"
  }

  return {
    income,
    needs: {
      actual: needsSpending,
      target: targetNeeds,
      actualPercentage: actualNeedsPct,
      targetPercentage: 50,
      variance: subtractMoney(needsSpending, targetNeeds),
      status: getStatus(needsSpending, targetNeeds),
    },
    wants: {
      actual: wantsSpending,
      target: targetWants,
      actualPercentage: actualWantsPct,
      targetPercentage: 30,
      variance: subtractMoney(wantsSpending, targetWants),
      status: getStatus(wantsSpending, targetWants),
    },
    savings: {
      actual: savingsAllocated,
      target: targetSavings,
      actualPercentage: actualSavingsPct,
      targetPercentage: 20,
      variance: subtractMoney(savingsAllocated, targetSavings),
      status: savingsAllocated >= targetSavings ? "BALANCED" : "UNDER",
    },
  }
}

/**
 * Evaluates holistic financial health score based on savings rate, budget discipline, fixed expenses, and liquid reserves
 */
export function evaluateFinancialHealthScore(params: {
  monthlyIncome: number
  monthlyExpenses: number
  totalLiquidBalance: number
  overBudgetCount: number
  totalBudgetsCount: number
  monthlyRecurringExpenses: number
}): FinancialHealthScoreResult {
  const {
    monthlyIncome,
    monthlyExpenses,
    totalLiquidBalance,
    overBudgetCount,
    totalBudgetsCount,
    monthlyRecurringExpenses,
  } = params

  const netSavings = subtractMoney(monthlyIncome, monthlyExpenses)
  const savingsRate = monthlyIncome > 0 ? calculatePercentage(netSavings, monthlyIncome) : (netSavings > 0 ? 100 : 0)
  const burnRate = monthlyIncome > 0 ? calculatePercentage(monthlyExpenses, monthlyIncome) : (monthlyExpenses > 0 ? 100 : 0)

  // 1. Savings Rate Score (Max 35 points)
  let savingsRateScore = 0
  if (savingsRate >= 25) savingsRateScore = 35
  else if (savingsRate >= 20) savingsRateScore = 30
  else if (savingsRate >= 10) savingsRateScore = 22
  else if (savingsRate >= 5) savingsRateScore = 15
  else if (savingsRate > 0) savingsRateScore = 8
  else savingsRateScore = 0

  // 2. Budget Adherence Score (Max 30 points)
  let budgetAdherenceScore = 30
  if (totalBudgetsCount > 0) {
    const overBudgetRatio = overBudgetCount / totalBudgetsCount
    if (overBudgetRatio === 0) budgetAdherenceScore = 30
    else if (overBudgetRatio <= 0.25) budgetAdherenceScore = 20
    else if (overBudgetRatio <= 0.5) budgetAdherenceScore = 12
    else budgetAdherenceScore = 5
  }

  // 3. Fixed Recurring Cost Ratio (Max 20 points)
  // Optimal fixed commitments are < 40% of income
  let fixedCostRatioScore = 20
  if (monthlyIncome > 0) {
    const fixedRatio = (monthlyRecurringExpenses / monthlyIncome) * 100
    if (fixedRatio <= 35) fixedCostRatioScore = 20
    else if (fixedRatio <= 50) fixedCostRatioScore = 15
    else if (fixedRatio <= 65) fixedCostRatioScore = 10
    else fixedCostRatioScore = 4
  } else if (monthlyRecurringExpenses > 0) {
    fixedCostRatioScore = 5
  }

  // 4. Emergency Runway Score (Max 15 points)
  // Runway = Liquid balance / Monthly expenses
  let emergencyRunwayScore = 0
  const monthlyExpenseBase = monthlyExpenses > 0 ? monthlyExpenses : 1
  const runwayMonths = totalLiquidBalance > 0 ? totalLiquidBalance / monthlyExpenseBase : 0

  if (runwayMonths >= 6) emergencyRunwayScore = 15
  else if (runwayMonths >= 3) emergencyRunwayScore = 12
  else if (runwayMonths >= 1) emergencyRunwayScore = 8
  else if (runwayMonths > 0) emergencyRunwayScore = 4
  else emergencyRunwayScore = 0

  const totalScore = Math.min(100, Math.max(0, savingsRateScore + budgetAdherenceScore + fixedCostRatioScore + emergencyRunwayScore))

  let rating: FinancialHealthScoreResult["rating"] = "MODERATE"
  let summary = "Your financial position is moderately stable."

  if (totalScore >= 85) {
    rating = "EXCELLENT"
    summary = "Outstanding financial stability! Strong savings velocity and controlled commitments."
  } else if (totalScore >= 70) {
    rating = "GOOD"
    summary = "Solid financial health with healthy cash flow and manageable recurring liabilities."
  } else if (totalScore >= 50) {
    rating = "MODERATE"
    summary = "Fair financial balance. Tightening discretionary spending can accelerate your goals."
  } else if (totalScore >= 30) {
    rating = "NEEDS_ATTENTION"
    summary = "Expenses are outpacing target thresholds. Review your active budgets and recurring subscriptions."
  } else {
    rating = "CRITICAL"
    summary = "Cash outflow exceeds cash inflow. Immediate expense reduction is recommended."
  }

  return {
    score: totalScore,
    rating,
    savingsRate,
    burnRate,
    breakdown: {
      savingsRateScore,
      budgetAdherenceScore,
      fixedCostRatioScore,
      emergencyRunwayScore,
    },
    summary,
  }
}

function multiplyMoney(a: number | string | Decimal, factor: number | string): number {
  return new Decimal(a || 0).times(new Decimal(factor || 0)).toNumber()
}

/**
 * Generates prioritized educational observations and action points
 */
export function generateInsightObservations(params: {
  monthlyIncome: number
  monthlyExpenses: number
  netFlow: number
  savingsRate: number
  overBudgets: { name: string; spent: number; amount: number; overAmount: number }[]
  nearBudgets: { name: string; spent: number; amount: number; percent: number }[]
  unbudgetedCategories: { name: string; spent: number }[]
  topSpendingCategory?: { name: string; amount: number; percentage: number }
  significantSpikes: MonthOverMonthDiff[]
  activeGoalsCount: number
  completedGoalsCount: number
  recurringMonthlyTotal: number
  recurringCount: number
}): FinancialInsightItem[] {
  const insights: FinancialInsightItem[] = []

  // 1. Cash flow & Savings Rate Insight
  if (params.netFlow < 0) {
    insights.push({
      id: "cf-negative",
      type: "HEALTH",
      severity: "CRITICAL",
      title: "Monthly Cash Flow Deficit",
      description: `Outflow exceeds income by $${Math.abs(params.netFlow).toLocaleString("en-US", { minimumFractionDigits: 2 })} this month.`,
      metric: `-$${Math.abs(params.netFlow).toFixed(2)}`,
      actionSuggestion: "Audit discretionary purchases and postpone non-essential expenses to restore surplus.",
    })
  } else if (params.savingsRate >= 20) {
    insights.push({
      id: "cf-healthy-savings",
      type: "SAVINGS",
      severity: "POSITIVE",
      title: "High Savings Velocity",
      description: `You are saving ${params.savingsRate}% of your income, surpassing the standard 20% benchmark.`,
      metric: `${params.savingsRate}% saved`,
      actionSuggestion: "Consider directing surplus funds toward active savings milestones or emergency reserves.",
    })
  } else if (params.savingsRate > 0 && params.savingsRate < 10) {
    insights.push({
      id: "cf-low-savings",
      type: "SAVINGS",
      severity: "WARNING",
      title: "Low Savings Buffer",
      description: `Your current net savings rate is ${params.savingsRate}%. Building an emergency cushion requires a higher margin.`,
      metric: `${params.savingsRate}% saved`,
      actionSuggestion: "Identify recurring subscriptions or dining expenses that can be trimmed this month.",
    })
  }

  // 2. Budget Alerts
  if (params.overBudgets.length > 0) {
    const names = params.overBudgets.map((b) => b.name).join(", ")
    const totalOver = params.overBudgets.reduce((acc, b) => addMoney(acc, b.overAmount), 0)
    insights.push({
      id: "budget-exceeded",
      type: "BUDGET",
      severity: "WARNING",
      title: `${params.overBudgets.length} Category ${params.overBudgets.length === 1 ? "Budget" : "Budgets"} Exceeded`,
      description: `Spending in ${names} has surpassed your set limit by $${totalOver.toFixed(2)}.`,
      metric: `+$${totalOver.toFixed(2)} over`,
      actionSuggestion: "Review itemized transactions in these categories or adjust next month's limits.",
    })
  }

  if (params.nearBudgets.length > 0) {
    const names = params.nearBudgets.map((b) => b.name).join(", ")
    insights.push({
      id: "budget-near-threshold",
      type: "BUDGET",
      severity: "INFO",
      title: "Approaching Budget Threshold",
      description: `${names} ${params.nearBudgets.length === 1 ? "is" : "are"} nearing the allocated monthly ceiling.`,
      actionSuggestion: "Monitor daily outlays in these categories for the remainder of the month.",
    })
  }

  // 3. Category Concentration & Spikes
  if (params.topSpendingCategory && params.topSpendingCategory.percentage >= 40) {
    insights.push({
      id: "spending-concentration",
      type: "SPENDING",
      severity: "INFO",
      title: "Spending Concentration",
      description: `${params.topSpendingCategory.name} represents ${params.topSpendingCategory.percentage}% of all expenditures this month.`,
      metric: `${params.topSpendingCategory.percentage}% total`,
      actionSuggestion: "Ensure major category outlays align with your overall monthly financial priorities.",
    })
  }

  if (params.significantSpikes.length > 0) {
    const spike = params.significantSpikes[0]
    insights.push({
      id: `spike-${spike.name.toLowerCase().replace(/\s+/g, "-")}`,
      type: "SPENDING",
      severity: spike.percentageChange > 50 ? "WARNING" : "INFO",
      title: `${spike.name} Spending Surged`,
      description: `${spike.name} increased by ${spike.percentageChange}% ($${spike.difference.toFixed(2)}) compared to last month.`,
      metric: `+${spike.percentageChange}%`,
      actionSuggestion: "Check for unexpected one-off charges or recurring price changes in this category.",
    })
  }

  // 4. Recurring Commitments
  if (params.monthlyIncome > 0 && params.recurringMonthlyTotal > 0) {
    const recurringRatio = (params.recurringMonthlyTotal / params.monthlyIncome) * 100
    if (recurringRatio >= 45) {
      insights.push({
        id: "recurring-high-burden",
        type: "RECURRING",
        severity: "WARNING",
        title: "High Fixed Recurring Overhead",
        description: `Fixed recurring schedules absorb ${recurringRatio.toFixed(1)}% ($${params.recurringMonthlyTotal.toFixed(2)}) of your income.`,
        metric: `${recurringRatio.toFixed(1)}% fixed`,
        actionSuggestion: "Audit your recurring list for unused memberships, auto-renewals, or negotiable utilities.",
      })
    }
  }

  // 5. Savings Goals
  if (params.activeGoalsCount === 0 && params.completedGoalsCount === 0) {
    insights.push({
      id: "goals-none-set",
      type: "SAVINGS",
      severity: "INFO",
      title: "No Active Savings Goals",
      description: "Setting specific target milestones significantly boosts long-term savings discipline.",
      actionSuggestion: "Create a target goal such as an Emergency Fund or Vacation Fund in the Goals tab.",
    })
  }

  return insights
}
