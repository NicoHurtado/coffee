import type { AccountType, Currency, TransactionKind } from "@/lib/types";

const SYMBOL: Record<Currency, string> = { USD: "$", COP: "$" };

export function formatMoney(amount: number, currency: Currency = "USD"): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "COP" ? 0 : 2,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(abs);
  return `${SYMBOL[currency]}${formatted}`;
}

/** Format a real signed value. `formatMoney` intentionally formats magnitude only. */
export function formatSignedMoney(
  amount: number,
  currency: Currency = "USD",
): string {
  return `${amount < 0 ? "-" : ""}${formatMoney(amount, currency)}`;
}

/** Credit balances are debt; asset-account balances keep their natural sign. */
export function formatAccountBalance(
  accountType: AccountType,
  balance: number,
  currency: Currency,
): string {
  return formatSignedMoney(accountType === "credit" ? -balance : balance, currency);
}

export function signedAmount(kind: TransactionKind, amount: number, currency: Currency = "USD") {
  if (kind === "income") return `+${formatMoney(amount, currency)}`;
  if (kind === "expense") return `-${formatMoney(amount, currency)}`;
  if (kind === "transfer") return `↔ ${formatMoney(amount, currency)}`;
  return formatMoney(amount, currency);
}

export function formatPct(n: number, digits = 1) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}
