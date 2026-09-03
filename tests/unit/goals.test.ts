import { describe, it, expect } from 'vitest';
import { SavingsGoalSchema, GoalContributionSchema } from '@/lib/validations';
import { addMoney, subtractMoney, calculatePercentage } from '@/lib/decimal';

describe('Savings Goal Validation Schemas', () => {
  it('accepts valid savings goal payload', () => {
    const validGoal = {
      title: 'Emergency Fund',
      targetAmount: 5000,
      currentAmount: 1200,
      targetDate: '2027-01-01',
      icon: 'shield',
      color: '#10b981',
      notes: 'Three months living buffer',
    };

    const result = SavingsGoalSchema.safeParse(validGoal);
    expect(result.success).toBe(true);
  });

  it('rejects invalid or non-positive target amount', () => {
    const zeroTarget = {
      title: 'Invalid Goal',
      targetAmount: 0,
    };

    const negativeTarget = {
      title: 'Invalid Goal',
      targetAmount: -500,
    };

    expect(SavingsGoalSchema.safeParse(zeroTarget).success).toBe(false);
    expect(SavingsGoalSchema.safeParse(negativeTarget).success).toBe(false);
  });

  it('rejects empty title in savings goal', () => {
    const emptyTitle = {
      title: '',
      targetAmount: 1000,
    };

    expect(SavingsGoalSchema.safeParse(emptyTitle).success).toBe(false);
  });

  it('accepts valid contribution and withdrawal payloads', () => {
    const validDeposit = {
      goalId: 'goal_123',
      amount: 250,
      type: 'CONTRIBUTION',
      note: 'Paycheck savings',
    };

    const validWithdrawal = {
      goalId: 'goal_123',
      amount: 100,
      type: 'WITHDRAWAL',
      note: 'Emergency expense',
    };

    expect(GoalContributionSchema.safeParse(validDeposit).success).toBe(true);
    expect(GoalContributionSchema.safeParse(validWithdrawal).success).toBe(true);
  });

  it('rejects non-positive contribution amounts', () => {
    const zeroDeposit = {
      goalId: 'goal_123',
      amount: 0,
      type: 'CONTRIBUTION',
    };

    expect(GoalContributionSchema.safeParse(zeroDeposit).success).toBe(false);
  });
});

describe('Savings Goal Balance & Pace Calculations', () => {
  it('accurately updates current amount upon deposit', () => {
    let currentAmount = 1450.50;
    const deposit = 300.25;

    currentAmount = addMoney(currentAmount, deposit);
    expect(currentAmount).toBe(1750.75);
  });

  it('accurately updates current amount upon withdrawal without dropping below zero', () => {
    const currentAmount = 250.0;
    const withdrawal = 120.5;

    const updated = Math.max(0, subtractMoney(currentAmount, withdrawal));
    expect(updated).toBe(129.5);

    const excessiveWithdrawal = 500.0;
    const floored = Math.max(0, subtractMoney(currentAmount, excessiveWithdrawal));
    expect(floored).toBe(0);
  });

  it('accurately calculates funding completion progress percentage', () => {
    const targetAmount = 4000;
    const currentAmount = 2600;

    const percentage = calculatePercentage(currentAmount, targetAmount);
    expect(percentage).toBe(65.0);

    const remaining = Math.max(0, subtractMoney(targetAmount, currentAmount));
    expect(remaining).toBe(1400);
  });

  it('calculates required monthly savings pace toward a target date', () => {
    const remaining = 2400;
    const monthsRemaining = 6;

    const monthlyPace = remaining / monthsRemaining;
    expect(monthlyPace).toBe(400);
  });
});
