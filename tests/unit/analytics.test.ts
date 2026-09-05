import { describe, it, expect } from 'vitest';
import { addMoney, subtractMoney, calculatePercentage } from '@/lib/decimal';

describe('Analytics Calculations & Metrics', () => {
  it('computes period totals and net savings with arbitrary precision', () => {
    const incomes = [3200.5, 3400.75, 3100.25];
    const expenses = [2100.1, 2450.35, 1980.8];

    const totalIncome = incomes.reduce((acc, v) => addMoney(acc, v), 0);
    const totalExpenses = expenses.reduce((acc, v) => addMoney(acc, v), 0);
    const netSavings = subtractMoney(totalIncome, totalExpenses);

    expect(totalIncome).toBe(9701.5);
    expect(totalExpenses).toBe(6531.25);
    expect(netSavings).toBe(3170.25);
  });

  it('calculates average monthly cash flow and savings rate accurately', () => {
    const totalIncome = 9000;
    const totalExpenses = 6000;
    const months = 3;

    const avgIncome = totalIncome / months;
    const avgExpenses = totalExpenses / months;
    const savingsRate = calculatePercentage(totalIncome - totalExpenses, totalIncome);

    expect(avgIncome).toBe(3000);
    expect(avgExpenses).toBe(2000);
    expect(savingsRate).toBe(33.3);
  });

  it('calculates category percentage share against total period expenses', () => {
    const totalPeriodExpense = 2500;
    const housingExpense = 1200;
    const foodExpense = 600;

    expect(calculatePercentage(housingExpense, totalPeriodExpense)).toBe(48);
    expect(calculatePercentage(foodExpense, totalPeriodExpense)).toBe(24);
  });
});
