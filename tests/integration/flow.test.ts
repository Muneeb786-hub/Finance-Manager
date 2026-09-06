import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  TransactionSchema,
  BudgetSchema,
  SavingsGoalSchema,
  GoalContributionSchema,
  RecurringTransactionSchema,
  ProfileSettingsSchema,
  AccountDataWipeSchema,
  OnboardingSetupSchema,
} from '@/lib/validations';
import {
  addMoney,
  subtractMoney,
  calculatePercentage,
  getBudgetStatus,
} from '@/lib/decimal';
import {
  calculateMonthOverMonthVariances,
  calculate503020Benchmark,
  evaluateFinancialHealthScore,
  generateInsightObservations,
} from '@/lib/insights';
import {
  advanceNextRunDate,
  calculateMonthlyEquivalent,
} from '@/lib/recurring';

describe('Financial Lifecycle Integration Flow', () => {
  // Step 1: User Registration & Onboarding
  it('successfully validates user registration and guided onboarding setup', () => {
    const registerPayload = {
      name: 'Sarah Connor',
      email: 'sarah.connor@example.com',
      password: 'StrongPassword123!',
    };
    const registerResult = RegisterSchema.safeParse(registerPayload);
    expect(registerResult.success).toBe(true);

    const onboardingPayload = {
      name: 'Sarah Connor',
      preferredCurrency: 'USD',
      timezone: 'America/Los_Angeles',
      initialBalance: 3500,
      budgetCategoryId: 'cat_groceries_1',
      budgetAmount: 450,
      goalTitle: 'Emergency Reserve',
      goalTargetAmount: 6000,
      seedDemoData: false,
    };
    const onboardingResult = OnboardingSetupSchema.safeParse(onboardingPayload);
    expect(onboardingResult.success).toBe(true);
  });

  // Step 2: Multi-Account Balance and Decimal Cash Flow
  it('correctly calculates net balance across checking, cash, and credit ledgers', () => {
    const accounts = [
      { name: 'Checking Account', openingBalance: 2500.5 },
      { name: 'Cash Wallet', openingBalance: 150.25 },
      { name: 'Credit Card', openingBalance: -250.75 },
    ];

    const initialTotal = accounts.reduce((sum, a) => addMoney(sum, a.openingBalance), 0);
    expect(initialTotal).toBe(2400.0);

    // Record income transaction
    const salaryTx = {
      type: 'INCOME' as const,
      amount: 3800.5,
      categoryId: 'cat_salary',
      date: '2026-09-01T00:00:00.000Z',
      description: 'Monthly Salary',
    };
    expect(TransactionSchema.safeParse(salaryTx).success).toBe(true);

    // Record expenses
    const rentTx = {
      type: 'EXPENSE' as const,
      amount: 1200.0,
      categoryId: 'cat_rent',
      date: '2026-09-02T00:00:00.000Z',
      description: 'Apartment Rent',
    };
    const groceriesTx = {
      type: 'EXPENSE' as const,
      amount: 320.25,
      categoryId: 'cat_groceries',
      date: '2026-09-05T00:00:00.000Z',
      description: 'Supermarket Groceries',
    };

    expect(TransactionSchema.safeParse(rentTx).success).toBe(true);
    expect(TransactionSchema.safeParse(groceriesTx).success).toBe(true);

    const totalIncome = salaryTx.amount;
    const totalExpenses = addMoney(rentTx.amount, groceriesTx.amount);
    const netFlow = subtractMoney(totalIncome, totalExpenses);

    expect(totalExpenses).toBe(1520.25);
    expect(netFlow).toBe(2280.25);

    const endingBalance = addMoney(initialTotal, netFlow);
    expect(endingBalance).toBe(4680.25);
  });

  // Step 3: Monthly Budget Thresholds and Consumption
  it('evaluates budget consumption and triggers threshold warnings', () => {
    const budget = {
      categoryId: 'cat_groceries',
      amount: 400.0,
      month: 9,
      year: 2026,
      alertThreshold: 75,
    };
    expect(BudgetSchema.safeParse(budget).success).toBe(true);

    const currentSpent = 320.0; // 80% consumption
    const percentage = calculatePercentage(currentSpent, budget.amount);
    expect(percentage).toBe(80.0);

    const status = getBudgetStatus(currentSpent, budget.amount, budget.alertThreshold);
    expect(status).toBe('APPROACHING');

    const remaining = subtractMoney(budget.amount, currentSpent);
    expect(remaining).toBe(80.0);
  });

  // Step 4: Savings Goal Milestone and Ledger Contributions
  it('tracks savings milestone contributions and computes goal progress', () => {
    const goal = {
      title: 'Emergency Reserve',
      targetAmount: 5000.0,
      currentAmount: 0.0,
      icon: 'shield',
      color: '#10b981',
    };
    expect(SavingsGoalSchema.safeParse(goal).success).toBe(true);

    // Record deposits
    const deposit1 = { goalId: 'goal_123', amount: 1500.0, type: 'CONTRIBUTION' as const };
    const deposit2 = { goalId: 'goal_123', amount: 1000.0, type: 'CONTRIBUTION' as const };
    expect(GoalContributionSchema.safeParse(deposit1).success).toBe(true);
    expect(GoalContributionSchema.safeParse(deposit2).success).toBe(true);

    const totalSaved = addMoney(deposit1.amount, deposit2.amount);
    expect(totalSaved).toBe(2500.0);

    const progressPct = calculatePercentage(totalSaved, goal.targetAmount);
    expect(progressPct).toBe(50.0);

    const remainingToSave = subtractMoney(goal.targetAmount, totalSaved);
    expect(remainingToSave).toBe(2500.0);
  });

  // Step 5: Recurring Commitments and Schedule Advancement
  it('normalizes recurring commitments and advances run dates accurately', () => {
    const weeklyGrocery = {
      type: 'EXPENSE' as const,
      amount: 100.0,
      categoryId: 'cat_food',
      description: 'Weekly Supermarket Run',
      frequency: 'WEEKLY' as const,
      startDate: '2026-09-01',
    };
    expect(RecurringTransactionSchema.safeParse(weeklyGrocery).success).toBe(true);

    const monthlyNormalized = calculateMonthlyEquivalent(weeklyGrocery.amount, weeklyGrocery.frequency);
    expect(monthlyNormalized).toBe(433.33); // (100 * 52) / 12

    const currentDate = new Date('2026-09-01T00:00:00.000Z');
    const nextDate = advanceNextRunDate(currentDate, 'WEEKLY');
    expect(nextDate.toISOString().split('T')[0]).toBe('2026-09-08');

    const evalDate = new Date('2026-09-09T00:00:00.000Z');
    expect(nextDate <= evalDate).toBe(true);
  });

  // Step 6: Holistic Financial Health Score and 50/30/20 Guidelines
  it('computes holistic health score and 50/30/20 guideline breakdown', () => {
    const income = 5000.0;
    const expenses = 3000.0;
    const liquidBalance = 15000.0; // 5 months runway

    const health = evaluateFinancialHealthScore({
      monthlyIncome: income,
      monthlyExpenses: expenses,
      totalLiquidBalance: liquidBalance,
      overBudgetCount: 0,
      totalBudgetsCount: 4,
      monthlyRecurringExpenses: 1200.0,
    });

    expect(health.score).toBeGreaterThanOrEqual(70);
    expect(health.savingsRate).toBe(40.0);

    const benchmark = calculate503020Benchmark(income, 2100.0, 900.0, 2000.0);
    expect(benchmark.needs.target).toBe(2500.0);
    expect(benchmark.wants.target).toBe(1500.0);
    expect(benchmark.savings.target).toBe(1000.0);
    expect(benchmark.needs.actualPercentage).toBe(42.0);
    expect(benchmark.savings.status).toBe('BALANCED');
  });

  // Step 7: Month-over-Month Category Variance Engine
  it('detects category spending spikes and month-over-month variances', () => {
    const currentMonthExpenses = [
      { categoryId: 'cat_dining', name: 'Dining Out', color: '#f59e0b', amount: 450.0 },
      { categoryId: 'cat_rent', name: 'Rent', color: '#8b5cf6', amount: 1200.0 },
    ];
    const previousMonthExpenses = [
      { categoryId: 'cat_dining', name: 'Dining Out', color: '#f59e0b', amount: 250.0 },
      { categoryId: 'cat_rent', name: 'Rent', color: '#8b5cf6', amount: 1200.0 },
    ];

    const diffs = calculateMonthOverMonthVariances(currentMonthExpenses, previousMonthExpenses);
    const diningDiff = diffs.find((d) => d.categoryId === 'cat_dining');

    expect(diningDiff).toBeDefined();
    expect(diningDiff?.difference).toBe(200.0);
    expect(diningDiff?.percentageChange).toBe(80.0);
    expect(diningDiff?.trend).toBe('INCREASED');
  });

  // Step 8: Data Privacy and Double-Confirmation Account Wipe
  it('strictly validates the double confirmation phrase for account wipes', () => {
    expect(AccountDataWipeSchema.safeParse({ confirmationPhrase: 'DELETE MY DATA' }).success).toBe(true);
    expect(AccountDataWipeSchema.safeParse({ confirmationPhrase: 'delete my data' }).success).toBe(false);
    expect(AccountDataWipeSchema.safeParse({ confirmationPhrase: 'DELETE' }).success).toBe(false);
  });
});
