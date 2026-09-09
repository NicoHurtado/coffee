import type {
  Account,
  AccountType,
  Transaction,
  TransferDirection,
} from "@/lib/types"

/**
 * Movement amounts are stored as positive magnitudes. Normalize legacy rows
 * here so an old negative expense can never turn into an addition through
 * double negation. Adjustments are absolute balance snapshots and keep their
 * sign.
 */
export function normalizeTransaction(tx: Transaction): Transaction {
  if (tx.kind === "adjustment") return tx
  return { ...tx, amount: Math.abs(tx.amount) }
}

/**
 * `direction` describes the effect on the account balance used by this app.
 * For assets it follows cash flow. A credit-card balance represents debt, so
 * the directions are reversed: a payment lowers debt and a cash advance raises
 * it.
 */
export function transferDirectionFor(
  accountType: AccountType,
  role: "source" | "destination"
): TransferDirection {
  if (accountType === "credit") {
    return role === "source" ? "in" : "out"
  }
  return role === "source" ? "out" : "in"
}

export function transactionChangesBalance(
  accountType: AccountType,
  tx: Transaction
): number {
  const amount = Math.abs(tx.amount)

  if (accountType === "credit") {
    if (tx.kind === "expense") return amount
    if (tx.kind === "income") return -amount
    if (tx.kind === "transfer") {
      return tx.direction === "in" ? amount : -amount
    }
    return 0
  }

  if (tx.kind === "income") return amount
  if (tx.kind === "expense") return -amount
  if (tx.kind === "transfer") {
    return tx.direction === "in" ? amount : -amount
  }
  return 0
}

export function isValidTransferPair(
  transactions: [Transaction, Transaction],
  accounts: Account[]
): boolean {
  const [first, second] = transactions
  const firstAccount = accounts.find(
    (account) => account.id === first.accountId
  )
  const secondAccount = accounts.find(
    (account) => account.id === second.accountId
  )
  if (!firstAccount || !secondAccount) return false

  const samePair =
    first.kind === "transfer" &&
    second.kind === "transfer" &&
    first.accountId !== second.accountId &&
    first.transferPairId === second.transferPairId &&
    first.amount === second.amount &&
    first.occurredAt === second.occurredAt &&
    firstAccount.currency === secondAccount.currency
  const firstRole =
    first.direction === transferDirectionFor(firstAccount.type, "source")
      ? "source"
      : "destination"
  const secondRole =
    second.direction === transferDirectionFor(secondAccount.type, "source")
      ? "source"
      : "destination"
  return samePair && firstRole !== secondRole
}
