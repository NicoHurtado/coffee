import type { Account, Transaction } from "@/lib/types";
import { accountBalance } from "./credit";
import { fixedIncomeBalance } from "./fixed-income";

export function computeAccountBalance(
  account: Account,
  txs: Transaction[],
  now: Date = new Date(),
): number {
  if (account.type === "fixed_income") return fixedIncomeBalance(account, txs, now);
  return accountBalance(account, txs);
}

/** Convert a balance to COP. USD accounts use TRM if available, otherwise kept as-is. */
export function toBaseCurrency(balance: number, currency: string, usdToCop?: number | null): number {
  if (currency === "USD" && usdToCop) return balance * usdToCop;
  return balance;
}

export function netWorth(
  accounts: Account[],
  txs: Transaction[],
  now: Date = new Date(),
  usdToCop?: number | null,
): number {
  return accounts.reduce((acc, a) => {
    const bal = computeAccountBalance(a, txs, now);
    const balCOP = toBaseCurrency(bal, a.currency, usdToCop);
    return a.type === "credit" ? acc - balCOP : acc + balCOP;
  }, 0);
}

/** % cambio vs hace 30 días aprox. */
export function monthlyChangePct(
  accounts: Account[],
  txs: Transaction[],
  now: Date = new Date(),
  usdToCop?: number | null,
): number {
  const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const txsPast = txs.filter((t) => new Date(t.occurredAt) <= past);
  const current = netWorth(accounts, txs, now, usdToCop);
  const previous = netWorth(accounts, txsPast, past, usdToCop);
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
