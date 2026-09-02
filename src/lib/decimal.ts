import Decimal from "decimal.js";

// Configure Decimal for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(value: number | string | Decimal): Decimal {
  return new Decimal(value || 0);
}

export function addMoney(a: number | string | Decimal, b: number | string | Decimal): number {
  return new Decimal(a || 0).plus(new Decimal(b || 0)).toNumber();
}

export function subtractMoney(a: number | string | Decimal, b: number | string | Decimal): number {
  return new Decimal(a || 0).minus(new Decimal(b || 0)).toNumber();
}

export function multiplyMoney(a: number | string | Decimal, factor: number | string): number {
  return new Decimal(a || 0).times(new Decimal(factor || 0)).toNumber();
}

export function calculatePercentage(spent: number | string, budget: number | string): number {
  const b = new Decimal(budget || 0);
  if (b.isZero() || b.isNegative()) return 0;
  const s = new Decimal(spent || 0);
  return s.dividedBy(b).times(100).toDecimalPlaces(1).toNumber();
}

export function getBudgetStatus(spent: number, budget: number, alertThreshold = 80): 'ON_TRACK' | 'APPROACHING' | 'OVER_BUDGET' {
  const percent = calculatePercentage(spent, budget);
  if (percent >= 100) return 'OVER_BUDGET';
  if (percent >= alertThreshold) return 'APPROACHING';
  return 'ON_TRACK';
}
