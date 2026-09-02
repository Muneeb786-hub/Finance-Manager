import { describe, it, expect } from 'vitest';
import {
  addMoney,
  subtractMoney,
  calculatePercentage,
  getBudgetStatus,
} from '@/lib/decimal';

describe('Dashboard Financial Metrics & Aggregations', () => {
  it('correctly calculates monthly net cash flow surplus and deficit', () => {
    const income = 4250.0;
    const expense = 3120.75;
    const surplus = subtractMoney(income, expense);
    expect(surplus).toBe(1129.25);

    const higherExpense = 5000.0;
    const deficit = subtractMoney(income, higherExpense);
    expect(deficit).toBe(-750.0);
  });

  it('correctly aggregates combined account balances and transaction flow', () => {
    const openingBalances = [2500, 180, 5000];
    const initialTotal = openingBalances.reduce((sum, val) => addMoney(sum, val), 0);
    expect(initialTotal).toBe(7680);

    const netTransactionFlow = subtractMoney(3200, 1450.5);
    const updatedNetWorth = addMoney(initialTotal, netTransactionFlow);
    expect(updatedNetWorth).toBe(9429.5);
  });

  it('evaluates budget statuses based on thresholds and spending', () => {
    const budgetAmount = 500;
    const alertThreshold = 80;

    // Below alert threshold (spent $350 / $500 = 70%)
    expect(getBudgetStatus(350, budgetAmount, alertThreshold)).toBe('ON_TRACK');

    // At or above alert threshold (spent $425 / $500 = 85%)
    expect(getBudgetStatus(425, budgetAmount, alertThreshold)).toBe('APPROACHING');

    // Exactly at budget limit (spent $500 / $500 = 100%)
    expect(getBudgetStatus(500, budgetAmount, alertThreshold)).toBe('OVER_BUDGET');

    // Over budget limit (spent $550 / $500 = 110%)
    expect(getBudgetStatus(550, budgetAmount, alertThreshold)).toBe('OVER_BUDGET');
  });

  it('calculates savings goal progress and remaining balance accurately', () => {
    const targetAmount = 3000;
    const currentAmount = 1850;

    const percentage = calculatePercentage(currentAmount, targetAmount);
    expect(percentage).toBe(61.7);

    const remaining = Math.max(0, subtractMoney(targetAmount, currentAmount));
    expect(remaining).toBe(1150);
  });

  it('calculates category percentage allocations accurately', () => {
    const totalExpenses = 2500;
    const rent = 1000;
    const food = 500;
    const utilities = 250;

    expect(calculatePercentage(rent, totalExpenses)).toBe(40.0);
    expect(calculatePercentage(food, totalExpenses)).toBe(20.0);
    expect(calculatePercentage(utilities, totalExpenses)).toBe(10.0);
  });
});
