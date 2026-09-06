import { describe, it, expect } from 'vitest';
import { parseBankAlert, detectMerchantAndCategory, SAMPLE_SMS_TEMPLATES } from '@/lib/merchant-sync';

describe('Bank & Card Transaction Alert Parser', () => {
  it('parses credit card charge for OpenAI (Rs. 5,600) with card ending digits', () => {
    const rawSms =
      'Dear Customer, transaction of Rs 5,600.00 carried out on your Card ending 4242 at OPENAI on 06-Sep-2026. Available balance: Rs 42,000.';
    const result = parseBankAlert(rawSms);

    expect(result.amount).toBe(5600);
    expect(result.merchant).toBe('OpenAI');
    expect(result.suggestedCategoryName).toBe('Subscriptions');
    expect(result.channel).toBe('CARD');
    expect(result.extractedIdentifier).toBe('4242');
  });

  it('parses Easypaisa 3737 transaction with mobile account number', () => {
    const rawSms =
      'You have paid Rs. 5,600.00 to OPENAI from Mobile Account 03001234567. Balance: Rs. 14,200.00. Trans ID: 1234567890';
    const result = parseBankAlert(rawSms);

    expect(result.amount).toBe(5600);
    expect(result.merchant).toBe('OpenAI');
    expect(result.channel).toBe('EASYPAISA');
    expect(result.providerHint).toBe('EASYPAISA');
    expect(result.extractedIdentifier).toBe('03001234567');
  });

  it('parses JazzCash 8558 transaction with mobile account number', () => {
    const rawSms =
      'Transaction of Rs. 1,450.00 paid to FOODPANDA via JazzCash Account 03011234567. Fee Rs. 0.00. TID: 987654321';
    const result = parseBankAlert(rawSms);

    expect(result.amount).toBe(1450);
    expect(result.merchant).toBe('Foodpanda');
    expect(result.channel).toBe('JAZZCASH');
    expect(result.providerHint).toBe('JAZZCASH');
    expect(result.extractedIdentifier).toBe('03011234567');
  });

  it('parses Meezan Bank debit card charge for OpenAI (Rs. 5,600)', () => {
    const rawSms =
      'Paid Rs. 5,600.00 at OPENAI using Meezan Visa Debit Card ending 4242 on 06-09-2026. Available Balance: PKR 88,400.00';
    const result = parseBankAlert(rawSms);

    expect(result.amount).toBe(5600);
    expect(result.merchant).toBe('OpenAI');
    expect(result.channel).toBe('BANK');
    expect(result.providerHint).toBe('MEEZAN_BANK');
    expect(result.extractedIdentifier).toBe('4242');
  });

  it('parses SadaPay charge with card ending digits', () => {
    const rawSms = 'You just spent Rs. 599.00 at SPOTIFY with your SadaPay card ending 1122.';
    const result = parseBankAlert(rawSms);

    expect(result.amount).toBe(599);
    expect(result.merchant).toBe('Spotify');
    expect(result.channel).toBe('CARD');
    expect(result.providerHint).toBe('SADAPAY');
    expect(result.extractedIdentifier).toBe('1122');
  });

  it('parses all SAMPLE_SMS_TEMPLATES without failure', () => {
    expect(SAMPLE_SMS_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const sample of SAMPLE_SMS_TEMPLATES) {
      const parsed = parseBankAlert(sample.text);
      expect(parsed.amount).toBeGreaterThan(0);
      expect(parsed.merchant.length).toBeGreaterThan(0);
    }
  });

  it('correctly maps merchant categories across utility bills and transport', () => {
    expect(detectMerchantAndCategory('CAREEM').category).toBe('Transport');
    expect(detectMerchantAndCategory('SHELL PETROL').category).toBe('Transport');
    expect(detectMerchantAndCategory('K-ELECTRIC').category).toBe('Bills');
    expect(detectMerchantAndCategory('SNGPL BILL').category).toBe('Bills');
    expect(detectMerchantAndCategory('DARAZ PK').category).toBe('Shopping');
  });
});

