import { describe, it, expect } from 'vitest';
import { RecurringTransactionSchema } from '@/lib/validations';
import {
  POPULAR_SUBSCRIPTION_PRESETS,
  SUBSCRIPTION_SUBCATEGORIES,
  getSubcategoryMeta,
} from '@/lib/subscription-presets';
import { calculateMonthlyEquivalent } from '@/lib/recurring';

describe('Subscription Management & Presets', () => {
  it('validates subscription with subcategory and flag', () => {
    const validSub = {
      type: 'EXPENSE',
      amount: 20.0,
      categoryId: 'cat_sub_123',
      description: 'ChatGPT Plus',
      frequency: 'MONTHLY',
      startDate: '2026-09-01',
      isSubscription: true,
      subcategory: 'AI',
      paymentMethod: 'CREDIT_CARD',
    };

    const result = RecurringTransactionSchema.safeParse(validSub);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isSubscription).toBe(true);
      expect(result.data.subcategory).toBe('AI');
    }
  });

  it('validates streaming subscription with annual frequency', () => {
    const annualSub = {
      type: 'EXPENSE',
      amount: 119.88,
      categoryId: 'cat_sub_123',
      description: 'Spotify Annual',
      frequency: 'YEARLY',
      startDate: '2026-01-01',
      isSubscription: true,
      subcategory: 'Entertainment',
    };

    const result = RecurringTransactionSchema.safeParse(annualSub);
    expect(result.success).toBe(true);
  });

  it('provides all required presets for AI, Entertainment, Cloud, and Software', () => {
    expect(POPULAR_SUBSCRIPTION_PRESETS.length).toBeGreaterThan(5);

    const presetNames = POPULAR_SUBSCRIPTION_PRESETS.map((p) => p.name.toLowerCase());
    expect(presetNames.some((n) => n.includes('chatgpt'))).toBe(true);
    expect(presetNames.some((n) => n.includes('spotify'))).toBe(true);
    expect(presetNames.some((n) => n.includes('youtube'))).toBe(true);
    expect(presetNames.some((n) => n.includes('google'))).toBe(true);

    for (const preset of POPULAR_SUBSCRIPTION_PRESETS) {
      expect(preset.defaultAmount).toBeGreaterThan(0);
      expect(preset.subcategory).toBeDefined();
      expect(preset.frequency).toMatch(/^(MONTHLY|YEARLY)$/);
    }
  });

  it('returns appropriate subcategory metadata and fallbacks', () => {
    const aiMeta = getSubcategoryMeta('AI');
    expect(aiMeta.label).toContain('AI');
    expect(aiMeta.color).toBeDefined();

    const cloudMeta = getSubcategoryMeta('Cloud');
    expect(cloudMeta.label).toContain('Cloud');

    const fallbackMeta = getSubcategoryMeta('UnknownCategory');
    expect(fallbackMeta.id).toBe('Other');
  });

  it('accurately projects annualized burn from monthly subscriptions', () => {
    const chatgptMonthly = calculateMonthlyEquivalent(20.0, 'MONTHLY');
    const spotifyMonthly = calculateMonthlyEquivalent(11.99, 'MONTHLY');
    const youtubeMonthly = calculateMonthlyEquivalent(13.99, 'MONTHLY');
    const googleMonthly = calculateMonthlyEquivalent(2.99, 'MONTHLY');

    const totalMonthly = chatgptMonthly + spotifyMonthly + youtubeMonthly + googleMonthly;
    expect(totalMonthly).toBeCloseTo(48.97, 2);

    const annualized = Math.round(totalMonthly * 12 * 100) / 100;
    expect(annualized).toBeCloseTo(587.64, 2);
  });
});
