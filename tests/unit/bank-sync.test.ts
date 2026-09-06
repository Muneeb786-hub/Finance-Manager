import { describe, it, expect } from 'vitest';
import { parseBankAlert, detectMerchantAndCategory } from '@/lib/merchant-sync';

describe('Bank & Card Transaction Alert Parser', () => {
  it('parses credit card charge for OpenAI (Rs. 5,600)', () => {
    const rawSms =
      'Dear Customer, transaction of Rs 5,600.00 carried out on your Card ending 4242 at OPENAI on 06-Sep-2026. Available balance: Rs 42,000.';
    const result = parseBankAlert(rawSms);

    expect(result.amount).toBe(5600);
    expect(result.merchant).toBe('OpenAI');
    expect(result.suggestedCategoryName).toBe('Subscriptions');
    expect(result.channel).toBe('CARD');
  });

  it('parses Easypaisa transaction for Spotify (Rs. 599)', () => {
    const rawSms =
      'You have sent Rs. 599 to SPOTIFY from your Easypaisa Mobile Account. Fee Rs. 0.00. Balance: Rs. 12,400. Trx ID 987654321.';
    const result = parseBankAlert(rawSms);

    expect(result.amount).toBe(599);
    expect(result.merchant).toBe('Spotify');
    expect(result.suggestedCategoryName).toBe('Subscriptions');
    expect(result.channel).toBe('EASYPAISA');
  });

  it('parses Meezan Bank debit card charge for Foodpanda (Rs. 1,450)', () => {
    const rawSms =
      'Paid Rs. 1450.00 at FOODPANDA using Meezan Bank Visa Debit Card ending 9876 on 06/09/2026.';
    const result = parseBankAlert(rawSms);

    expect(result.amount).toBe(1450);
    expect(result.merchant).toBe('Foodpanda');
    expect(result.suggestedCategoryName).toBe('Food');
    expect(result.channel).toBe('BANK');
  });

  it('correctly maps merchant categories across utility bills and transport', () => {
    expect(detectMerchantAndCategory('CAREEM').category).toBe('Transport');
    expect(detectMerchantAndCategory('SHELL PETROL').category).toBe('Transport');
    expect(detectMerchantAndCategory('K-ELECTRIC').category).toBe('Bills');
    expect(detectMerchantAndCategory('SNGPL BILL').category).toBe('Bills');
    expect(detectMerchantAndCategory('DARAZ PK').category).toBe('Shopping');
  });
});
