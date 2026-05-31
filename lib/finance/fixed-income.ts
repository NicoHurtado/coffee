import type { FixedIncomeAccount, Transaction } from "@/lib/types";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / DAY_MS);
}

/** Balance actual con interés compuesto continuo aproximado: initial * (1+rate)^(days/365). */
export function fixedIncomeBalance(
  account: FixedIncomeAccount,
  txs: Transaction[],
  now: Date = new Date(),
): number {
  const lastAdj = [...txs]
    .filter((t) => t.accountId === account.id && t.kind === "adjustment")
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];

  if (lastAdj) {
    const base = lastAdj.amount;
    const days = daysBetween(new Date(lastAdj.occurredAt), now);
    return base * Math.pow(1 + account.annualRate / 100, days / 365);
  }

  const start = new Date(account.startDate);
  const days = daysBetween(start, now);
  return account.initialBalance * Math.pow(1 + account.annualRate / 100, days / 365);
}

export function accruedYield(
  account: FixedIncomeAccount,
  txs: Transaction[],
  now: Date = new Date(),
): number {
  return fixedIncomeBalance(account, txs, now) - account.initialBalance;
}

export function daysToMaturity(
  account: FixedIncomeAccount,
  now: Date = new Date(),
): number | null {
  if (!account.maturityDate) return null;
  const mat = new Date(account.maturityDate);
  return Math.max(0, Math.ceil(daysBetween(now, mat)));
}
