import type { Account, CreditAccount, Transaction } from "@/lib/types"
import { transactionChangesBalance } from "./transactions"

/**
 * Balance para cuentas no-fixed-income.
 * Débito: initial + ingresos - gastos + ajustes.
 * Crédito: initial + gastos - pagos (ingresos reducen deuda). El balance es la deuda actual.
 * Inversión: usa último ajuste si existe, sino initial + ingresos - gastos.
 */
export function accountBalance(
  account: Account,
  txs: Transaction[],
  now: Date = new Date()
): number {
  const nowTime = now.getTime()
  if (new Date(account.createdAt).getTime() > nowTime) return 0

  // An adjustment is an absolute snapshot: only the most recent one matters.
  // Find it without allocating or sorting the complete history (O(n), rather
  // than O(n log n)), then add only movements made after that snapshot.
  let latestAdjustmentAt = Number.NEGATIVE_INFINITY
  let balance = account.initialBalance

  for (const tx of txs) {
    if (tx.accountId !== account.id || tx.kind !== "adjustment") continue
    const time = new Date(tx.occurredAt).getTime()
    if (!Number.isFinite(time) || time > nowTime || time < latestAdjustmentAt)
      continue
    latestAdjustmentAt = time
    balance = tx.amount
  }

  for (const tx of txs) {
    if (tx.accountId !== account.id || tx.kind === "adjustment") continue
    const time = new Date(tx.occurredAt).getTime()
    if (!Number.isFinite(time) || time > nowTime || time <= latestAdjustmentAt)
      continue
    balance += transactionChangesBalance(account.type, tx)
  }

  return balance
}

export function utilizationPct(
  account: CreditAccount,
  txs: Transaction[]
): number {
  const bal = Math.max(0, accountBalance(account, txs))
  if (account.creditLimit <= 0) return 0
  return (bal / account.creditLimit) * 100
}

export function availableCredit(
  account: CreditAccount,
  txs: Transaction[]
): number {
  return Math.max(
    0,
    account.creditLimit - Math.max(0, accountBalance(account, txs))
  )
}
