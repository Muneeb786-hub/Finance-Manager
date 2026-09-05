import { describe, it, expect } from 'vitest';
import {
  calculateMonthOverMonthVariances,
  calculate503020Benchmark,
  evaluateFinancialHealthScore,
  generateInsightObservations,
} from '@/lib/insights';

describe('Financial Insights Calculation Engine', () => {
  describe('Month-over-Month Variance Calculation', () => {
    it('detects category spending increases and percentage jumps', () => {
      const current = [
        { categoryId: 'cat_dining', name: 'Dining Out', color: '#f59e0b', amount: 350 },
        { categoryId: 'cat_groceries', name: 'Groceries', color: '#10b981', amount: 400 },
      ];
      const previous = [
        { categoryId: 'cat_dining', name: 'Dining Out', color: '#f59e0b', amount: 200 },
        { categoryId: 'cat_groceries', name: 'Groceries', color: '#10b981', amount: 450 },
      ];

      const variances = calculateMonthOverMonthVariances(current, previous);
      const diningDiff = variances.find((v) => v.categoryId === 'cat_dining');
      const groceriesDiff = variances.find((v) => v.categoryId === 'cat_groceries');

      expect(diningDiff).toBeDefined();
      expect(diningDiff?.difference).toBe(150);
      expect(diningDiff?.percentageChange).toBe(75);
      expect(diningDiff?.trend).toBe('INCREASED');

      expect(groceriesDiff).toBeDefined();
      expect(groceriesDiff?.difference).toBe(-50);
      expect(groceriesDiff?.percentageChange).toBe(-11.1);
      expect(groceriesDiff?.trend).toBe('DECREASED');
    });

    it('identifies new spending categories with no prior history', () => {
      const current = [
        { categoryId: 'cat_travel', name: 'Travel', color: '#3b82f6', amount: 600 },
      ];
      const previous: any[] = [];

      const variances = calculateMonthOverMonthVariances(current, previous);
      expect(variances[0].trend).toBe('NEW');
      expect(variances[0].percentageChange).toBe(100);
      expect(variances[0].difference).toBe(600);
    });
  });

  describe('50/30/20 Rule Benchmark', () => {
    it('computes correct ideal targets and allocation variances for given income', () => {
      const income = 5000;
      const needs = 2200; // target 2500 (50%)
      const wants = 1800; // target 1500 (30%)
      const savings = 1000; // target 1000 (20%)

      const benchmark = calculate503020Benchmark(income, needs, wants, savings);

      expect(benchmark.needs.target).toBe(2500);
      expect(benchmark.needs.actualPercentage).toBe(44);
      expect(benchmark.needs.status).toBe('UNDER');

      expect(benchmark.wants.target).toBe(1500);
      expect(benchmark.wants.actualPercentage).toBe(36);
      expect(benchmark.wants.status).toBe('OVER');

      expect(benchmark.savings.target).toBe(1000);
      expect(benchmark.savings.actualPercentage).toBe(20);
      expect(benchmark.savings.status).toBe('BALANCED');
    });

    it('handles zero income edge case gracefully', () => {
      const benchmark = calculate503020Benchmark(0, 500, 300, 0);
      expect(benchmark.needs.target).toBe(0);
      expect(benchmark.needs.actualPercentage).toBe(0);
      expect(benchmark.wants.actualPercentage).toBe(0);
    });
  });

  describe('Financial Health Score Evaluation', () => {
    it('awards high rating for strong savings and zero over-budgets', () => {
      const health = evaluateFinancialHealthScore({
        monthlyIncome: 6000,
        monthlyExpenses: 4000, // 33.3% savings rate
        totalLiquidBalance: 24000, // 6 months runway
        overBudgetCount: 0,
        totalBudgetsCount: 5,
        monthlyRecurringExpenses: 1200, // 20% fixed ratio
      });

      expect(health.score).toBeGreaterThanOrEqual(85);
      expect(health.rating).toBe('EXCELLENT');
      expect(health.savingsRate).toBe(33.3);
    });

    it('flags critical status when expenses exceed income', () => {
      const health = evaluateFinancialHealthScore({
        monthlyIncome: 3000,
        monthlyExpenses: 4200, // deficit
        totalLiquidBalance: 500,
        overBudgetCount: 3,
        totalBudgetsCount: 4,
        monthlyRecurringExpenses: 2000,
      });

      expect(health.score).toBeLessThan(40);
      expect(health.rating).toBe('CRITICAL');
      expect(health.savingsRate).toBe(-40);
    });
  });

  describe('Actionable Insights & Observations Generation', () => {
    it('generates over-budget warning observation when budgets are exceeded', () => {
      const items = generateInsightObservations({
        monthlyIncome: 4000,
        monthlyExpenses: 3000,
        netFlow: 1000,
        savingsRate: 25,
        overBudgets: [{ name: 'Entertainment', spent: 320, amount: 200, overAmount: 120 }],
        nearBudgets: [],
        unbudgetedCategories: [],
        significantSpikes: [],
        activeGoalsCount: 2,
        completedGoalsCount: 0,
        recurringMonthlyTotal: 800,
        recurringCount: 3,
      });

      const budgetAlert = items.find((i) => i.type === 'BUDGET');
      expect(budgetAlert).toBeDefined();
      expect(budgetAlert?.title).toContain('Budget Exceeded');
      expect(budgetAlert?.metric).toBe('+$120.00 over');
    });

    it('generates deficit alert when monthly cash flow is negative', () => {
      const items = generateInsightObservations({
        monthlyIncome: 2000,
        monthlyExpenses: 2800,
        netFlow: -800,
        savingsRate: 0,
        overBudgets: [],
        nearBudgets: [],
        unbudgetedCategories: [],
        significantSpikes: [],
        activeGoalsCount: 1,
        completedGoalsCount: 0,
        recurringMonthlyTotal: 500,
        recurringCount: 2,
      });

      const deficitAlert = items.find((i) => i.id === 'cf-negative');
      expect(deficitAlert).toBeDefined();
      expect(deficitAlert?.severity).toBe('CRITICAL');
    });
  });
});
