import { describe, it, expect } from 'vitest';
import { OnboardingSetupSchema } from '@/lib/validations';

describe('Onboarding & Setup Validation Schema', () => {
  it('accepts valid onboarding setup payload with profile, balance, and goals', () => {
    const valid = {
      name: 'Muneeb',
      preferredCurrency: 'USD',
      timezone: 'America/New_York',
      initialBalance: 2500,
      budgetCategoryId: 'cat_groceries_1',
      budgetAmount: 450,
      goalTitle: 'Emergency Fund',
      goalTargetAmount: 5000,
      seedDemoData: false,
    };

    const result = OnboardingSetupSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts minimal onboarding payload with defaults', () => {
    const minimal = {
      name: 'Muneeb',
    };

    const result = OnboardingSetupSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preferredCurrency).toBe('USD');
      expect(result.data.timezone).toBe('UTC');
      expect(result.data.initialBalance).toBe(0);
      expect(result.data.seedDemoData).toBe(false);
    }
  });

  it('rejects short name in onboarding', () => {
    const invalid = {
      name: 'A',
      preferredCurrency: 'USD',
    };

    expect(OnboardingSetupSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects negative initial balance or invalid budget amount', () => {
    const negativeBalance = {
      name: 'Muneeb',
      initialBalance: -50,
    };

    const negativeBudget = {
      name: 'Muneeb',
      budgetAmount: -100,
    };

    expect(OnboardingSetupSchema.safeParse(negativeBalance).success).toBe(false);
    expect(OnboardingSetupSchema.safeParse(negativeBudget).success).toBe(false);
  });
});
