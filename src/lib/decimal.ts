import Decimal from "decimal.js";

// Configure Decimal for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type MoneyValue = number | string | Decimal | { toString(): string }

export function toDecimal(value: MoneyValue): Decimal {
  return new Decimal(value == null ? 0 : value.toString());
}

export function addMoney(a: MoneyValue, b: MoneyValue): number {
  return toDecimal(a).plus(toDecimal(b)).toNumber();
}

export function subtractMoney(a: MoneyValue, b: MoneyValue): number {
  return toDecimal(a).minus(toDecimal(b)).toNumber();
}

export function multiplyMoney(a: MoneyValue, factor: MoneyValue): number {
  return toDecimal(a).times(toDecimal(factor)).toNumber();
}

export function calculatePercentage(spent: MoneyValue, budget: MoneyValue): number {
  const b = toDecimal(budget);
  if (b.isZero() || b.isNegative()) return 0;
  const s = toDecimal(spent);
  return s.dividedBy(b).times(100).toDecimalPlaces(1).toNumber();
}

export function getBudgetStatus(spent: MoneyValue, budget: MoneyValue, alertThreshold: MoneyValue = 80): 'ON_TRACK' | 'APPROACHING' | 'OVER_BUDGET' {
  const percent = calculatePercentage(spent, budget);
  if (percent >= 100) return 'OVER_BUDGET';
  if (percent >= toDecimal(alertThreshold).toNumber()) return 'APPROACHING';
  return 'ON_TRACK';
}
