import { describe, it, expect } from 'vitest';
import { BudgetSchema } from '@/lib/validations';
import { calculatePercentage, getBudgetStatus, subtractMoney } from '@/lib/decimal';

describe('Budget Validation Schema', () => {
  it('accepts valid monthly budget payload', () => {
    const valid = {
      categoryId: 'cat_groceries_123',
      amount: 450,
      month: 9,
      year: 2026,
      alertThreshold: 85,
    };

    const result = BudgetSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects non-positive or zero budget amount', () => {
    const zeroAmount = {
      categoryId: 'cat_123',
      amount: 0,
      month: 9,
      year: 2026,
    };

    const negativeAmount = {
      categoryId: 'cat_123',
      amount: -100,
      month: 9,
      year: 2026,
    };

    expect(BudgetSchema.safeParse(zeroAmount).success).toBe(false);
    expect(BudgetSchema.safeParse(negativeAmount).success).toBe(false);
  });

  it('rejects out of bounds month and year', () => {
    const invalidMonth = {
      categoryId: 'cat_123',
      amount: 200,
      month: 13,
      year: 2026,
    };

    const zeroMonth = {
      categoryId: 'cat_123',
      amount: 200,
      month: 0,
      year: 2026,
    };

    const pastYear = {
      categoryId: 'cat_123',
      amount: 200,
      month: 9,
      year: 2010,
    };

    expect(BudgetSchema.safeParse(invalidMonth).success).toBe(false);
    expect(BudgetSchema.safeParse(zeroMonth).success).toBe(false);
    expect(BudgetSchema.safeParse(pastYear).success).toBe(false);
  });

  it('rejects invalid alert thresholds', () => {
    const thresholdZero = {
      categoryId: 'cat_123',
      amount: 200,
      month: 9,
      year: 2026,
      alertThreshold: 0,
    };

    const thresholdAbove100 = {
      categoryId: 'cat_123',
      amount: 200,
      month: 9,
      year: 2026,
      alertThreshold: 105,
    };

    expect(BudgetSchema.safeParse(thresholdZero).success).toBe(false);
    expect(BudgetSchema.safeParse(thresholdAbove100).success).toBe(false);
  });
});

describe('Budget Consumption and Status Calculations', () => {
  it('correctly reports on-track status under the alert threshold', () => {
    const budget = 500;
    const spent = 250; // 50%
    const threshold = 80;

    const percent = calculatePercentage(spent, budget);
    expect(percent).toBe(50);
    expect(getBudgetStatus(spent, budget, threshold)).toBe('ON_TRACK');
    expect(subtractMoney(budget, spent)).toBe(250);
  });

  it('triggers approaching limit status when reaching or exceeding alert threshold', () => {
    const budget = 600;
    const spent = 490; // ~81.7%
    const threshold = 80;

    const percent = calculatePercentage(spent, budget);
    expect(percent).toBe(81.7);
    expect(getBudgetStatus(spent, budget, threshold)).toBe('APPROACHING');
  });

  it('triggers over-budget status when spending matches or surpasses ceiling', () => {
    const budget = 300;
    const exactlyMax = 300;
    const overSpent = 345.5;

    expect(getBudgetStatus(exactlyMax, budget)).toBe('OVER_BUDGET');
    expect(getBudgetStatus(overSpent, budget)).toBe('OVER_BUDGET');

    const overAmount = subtractMoney(overSpent, budget);
    expect(overAmount).toBe(45.5);
  });
});
