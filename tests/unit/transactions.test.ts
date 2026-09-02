import { describe, it, expect } from 'vitest';
import { TransactionSchema } from '@/lib/validations';
import { addMoney, subtractMoney } from '@/lib/decimal';

describe('Transaction Validation Schema', () => {
  it('accepts valid expense transaction payload', () => {
    const validData = {
      type: 'EXPENSE',
      amount: 45.5,
      categoryId: 'cat_food_123',
      accountId: 'acc_bank_456',
      date: '2026-09-02',
      description: 'Grocery run',
      paymentMethod: 'CREDIT_CARD',
      tags: ['groceries', 'food'],
    };

    const result = TransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts valid income transaction payload', () => {
    const validData = {
      type: 'INCOME',
      amount: 2500,
      categoryId: 'cat_salary_123',
      date: '2026-09-01',
      description: 'Monthly salary',
      paymentMethod: 'BANK_TRANSFER',
      tags: ['work', 'salary'],
    };

    const result = TransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects zero or negative amount', () => {
    const zeroAmount = {
      type: 'EXPENSE',
      amount: 0,
      categoryId: 'cat_123',
      date: '2026-09-02',
      description: 'Zero test',
    };

    const negativeAmount = {
      type: 'EXPENSE',
      amount: -15,
      categoryId: 'cat_123',
      date: '2026-09-02',
      description: 'Negative test',
    };

    expect(TransactionSchema.safeParse(zeroAmount).success).toBe(false);
    expect(TransactionSchema.safeParse(negativeAmount).success).toBe(false);
  });

  it('rejects missing required categoryId and description', () => {
    const missingFields = {
      type: 'EXPENSE',
      amount: 25,
      date: '2026-09-02',
      description: '',
      categoryId: '',
    };

    const result = TransactionSchema.safeParse(missingFields);
    expect(result.success).toBe(false);
  });
});

describe('Transaction Ledger Decimal Math', () => {
  it('accurately accumulates multiple transaction amounts without floating point creep', () => {
    const entries = [19.99, 5.49, 12.00, 0.99, 100.05];
    let total = 0;
    for (const entry of entries) {
      total = addMoney(total, entry);
    }
    expect(total).toBe(138.52);
  });

  it('accurately calculates net cash flow', () => {
    const income = 3500.50;
    const expenses = 1874.25;
    const net = subtractMoney(income, expenses);
    expect(net).toBe(1626.25);
  });
});
