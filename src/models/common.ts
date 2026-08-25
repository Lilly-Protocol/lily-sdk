export interface AuditMetadata {
  createdAt: string;
  updatedAt: string;
}

export interface PaginationQuery {
  limit?: number;
  cursor?: string;
}

export interface MoneyAmount {
  assetCode: string;
  assetIssuer?: string;
  amount: string;
}

export type ResourceStatus = 'pending' | 'active' | 'inactive' | 'failed';

/**
 * Normalizes a MoneyAmount's decimal string to exactly 2 decimal places.
 * Trims leading zeros, truncates excess decimals, and pads short decimals.
 * Returns a new object — the original is not mutated.
 */
export function normalizeMoneyAmount(money: MoneyAmount): MoneyAmount {
  const raw = money.amount.trim();
  const numericValue = parseFloat(raw);

  if (!Number.isFinite(numericValue)) {
    throw new RangeError(`Invalid MoneyAmount: "${money.amount}" is not a finite number.`);
  }

  const normalized = numericValue.toFixed(2);

  return {
    ...money,
    amount: normalized,
  };
}
