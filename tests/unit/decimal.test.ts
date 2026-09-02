import { describe, it, expect } from 'vitest';
import {
  addMoney,
  subtractMoney,
  multiplyMoney,
  calculatePercentage,
  getBudgetStatus,
} from '@/lib/decimal';

describe('Decimal Financial Math Engine', () => {
  it('correctly avoids JavaScript floating point precision issues', () => {
    // In standard JS: 0.1 + 0.2 === 0.30000000000000004
    const result = addMoney(0.1, 0.2);
    expect(result).toBe(0.3);
  });

  it('correctly subtracts amounts without precision loss', () => {
    // In standard JS: 1.0 - 0.9 === 0.09999999999999998
    const result = subtractMoney(1.0, 0.9);
    expect(result).toBe(0.1);
  });

  it('correctly calculates budget percentages', () => {
    expect(calculatePercentage(50, 100)).toBe(50);
    expect(calculatePercentage(85, 100)).toBe(85);
    expect(calculatePercentage(120, 100)).toBe(120);
    expect(calculatePercentage(0, 100)).toBe(0);
    expect(calculatePercentage(100, 0)).toBe(0);
  });

  it('correctly calculates budget status levels', () => {
    expect(getBudgetStatus(50, 100, 80)).toBe('ON_TRACK');
    expect(getBudgetStatus(80, 100, 80)).toBe('APPROACHING');
    expect(getBudgetStatus(95, 100, 80)).toBe('APPROACHING');
    expect(getBudgetStatus(100, 100, 80)).toBe('OVER_BUDGET');
    expect(getBudgetStatus(120, 100, 80)).toBe('OVER_BUDGET');
  });
});
