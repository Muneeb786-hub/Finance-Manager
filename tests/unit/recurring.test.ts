import { describe, it, expect } from 'vitest';
import { RecurringTransactionSchema } from '@/lib/validations';
import { advanceNextRunDate, calculateMonthlyEquivalent } from '@/lib/recurring';

describe('Recurring Transaction Validation Schema', () => {
  it('accepts valid recurring expense schedule', () => {
    const validExpense = {
      type: 'EXPENSE',
      amount: 850,
      categoryId: 'cat_rent_123',
      description: 'Monthly Apartment Rent',
      frequency: 'MONTHLY',
      startDate: '2026-09-01',
      paymentMethod: 'BANK_TRANSFER',
    };

    const result = RecurringTransactionSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it('accepts valid recurring income schedule', () => {
    const validIncome = {
      type: 'INCOME',
      amount: 3200,
      categoryId: 'cat_salary_123',
      description: 'Stipend & Salary',
      frequency: 'MONTHLY',
      startDate: '2026-09-01',
      paymentMethod: 'DIRECT_DEPOSIT',
    };

    const result = RecurringTransactionSchema.safeParse(validIncome);
    expect(result.success).toBe(true);
  });

  it('rejects invalid recurrence frequency', () => {
    const invalidFreq = {
      type: 'EXPENSE',
      amount: 50,
      categoryId: 'cat_123',
      description: 'Subscription',
      frequency: 'BIWEEKLY', // Not in enum
      startDate: '2026-09-01',
    };

    expect(RecurringTransactionSchema.safeParse(invalidFreq).success).toBe(false);
  });

  it('rejects non-positive recurring amount', () => {
    const zeroAmount = {
      type: 'EXPENSE',
      amount: 0,
      categoryId: 'cat_123',
      description: 'Zero test',
      frequency: 'MONTHLY',
      startDate: '2026-09-01',
    };

    expect(RecurringTransactionSchema.safeParse(zeroAmount).success).toBe(false);
  });
});

describe('Recurring Date Advancements', () => {
  it('advances daily schedule by exactly one day', () => {
    const initial = new Date('2026-09-03T10:00:00Z');
    const next = advanceNextRunDate(initial, 'DAILY');
    expect(next.getDate()).toBe(4);
    expect(next.getMonth()).toBe(initial.getMonth());
  });

  it('advances weekly schedule by exactly seven days', () => {
    const initial = new Date('2026-09-03T10:00:00Z');
    const next = advanceNextRunDate(initial, 'WEEKLY');
    expect(next.getDate()).toBe(10);
    expect(next.getMonth()).toBe(initial.getMonth());
  });

  it('advances monthly schedule by one month', () => {
    const initial = new Date('2026-09-15T10:00:00Z');
    const next = advanceNextRunDate(initial, 'MONTHLY');
    expect(next.getMonth()).toBe(9); // 0-indexed: Sep is 8, Oct is 9
    expect(next.getDate()).toBe(15);
  });

  it('advances yearly schedule by one year', () => {
    const initial = new Date('2026-09-03T10:00:00Z');
    const next = advanceNextRunDate(initial, 'YEARLY');
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(initial.getMonth());
  });
});

describe('Cash Flow Normalization Calculations', () => {
  it('normalizes various frequencies to accurate monthly equivalent numbers', () => {
    // Daily $10 -> $300/mo
    expect(calculateMonthlyEquivalent(10, 'DAILY')).toBe(300);

    // Weekly $100 -> ~ $433.33/mo
    expect(calculateMonthlyEquivalent(100, 'WEEKLY')).toBe(433.33);

    // Monthly $50 -> $50/mo
    expect(calculateMonthlyEquivalent(50, 'MONTHLY')).toBe(50);

    // Yearly $1200 -> $100/mo
    expect(calculateMonthlyEquivalent(1200, 'YEARLY')).toBe(100);
  });
});
