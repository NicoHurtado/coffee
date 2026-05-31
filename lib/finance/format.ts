import type { Currency, TransactionKind } from "@/lib/types";

const SYMBOL: Record<Currency, string> = { USD: "$", COP: "$" };

export function formatMoney(amount: number, currency: Currency = "USD"): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: currency === "COP" ? 0 : 2,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(abs);
  return `${SYMBOL[currency]}${formatted}`;
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
