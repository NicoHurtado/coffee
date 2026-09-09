import type { Account, CreditAccount, Transaction } from "@/lib/types";
import { transactionChangesBalance } from "./transactions";

/**
 * Balance para cuentas no-fixed-income.
 * Débito: initial + ingresos - gastos + ajustes.
 * Crédito: initial + gastos - pagos (ingresos reducen deuda). El balance es la deuda actual.
 * Inversión: usa último ajuste si existe, sino initial + ingresos - gastos.
 */
export function accountBalance(
  account: Account,
  txs: Transaction[],
  now: Date = new Date(),
): number {
  const nowTime = now.getTime();
  if (new Date(account.createdAt).getTime() > nowTime) return 0;

  // Adjustments are absolute snapshots. Apply movements chronologically so an
  // adjustment discards only the history before it, never movements after it.
  const own = txs
    .filter((t) => t.accountId === account.id)
    .map((t) => ({ tx: t, time: new Date(t.occurredAt).getTime() }))
    .filter(({ time }) => Number.isFinite(time) && time <= nowTime)
    .sort((a, b) => a.time - b.time);

  return own.reduce((balance, { tx }) => {
    if (tx.kind === "adjustment") return tx.amount;
    return balance + transactionChangesBalance(account.type, tx);
  }, account.initialBalance);
}

export function utilizationPct(account: CreditAccount, txs: Transaction[]): number {
  const bal = Math.max(0, accountBalance(account, txs));
  if (account.creditLimit <= 0) return 0;
  return (bal / account.creditLimit) * 100;
}

export function availableCredit(account: CreditAccount, txs: Transaction[]): number {
  return Math.max(0, account.creditLimit - Math.max(0, accountBalance(account, txs)));
}
