import type { Account, CreditAccount, Transaction } from "@/lib/types";

/**
 * Balance para cuentas no-fixed-income.
 * Débito: initial + ingresos - gastos + ajustes.
 * Crédito: initial + gastos - pagos (ingresos reducen deuda). El balance es la deuda actual.
 * Inversión: usa último ajuste si existe, sino initial + ingresos - gastos.
 */
export function accountBalance(account: Account, txs: Transaction[]): number {
  const own = txs.filter((t) => t.accountId === account.id);

  if (account.type === "investment") {
    const lastAdj = [...own]
      .filter((t) => t.kind === "adjustment")
      .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];
    if (lastAdj) return lastAdj.amount;
    return own.reduce(
      (acc, t) => acc + (t.kind === "income" ? t.amount : -t.amount),
      account.initialBalance,
    );
  }

  if (account.type === "credit") {
    return own.reduce((acc, t) => {
      if (t.kind === "expense") return acc + t.amount;
      if (t.kind === "income" || t.kind === "transfer") return acc - t.amount;
      return acc;
    }, account.initialBalance);
  }

  // debit
  return own.reduce((acc, t) => {
    if (t.kind === "income") return acc + t.amount;
    if (t.kind === "expense" || t.kind === "transfer") return acc - t.amount;
    if (t.kind === "adjustment") return t.amount;
    return acc;
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
