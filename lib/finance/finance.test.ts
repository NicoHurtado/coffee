import { describe, expect, it } from "vitest"
import type { Account, FixedIncomeAccount, Transaction } from "../types"
import { accountBalance } from "./credit"
import { fixedIncomeBalance } from "./fixed-income"
import { netWorth, toBaseCurrency } from "./net-worth"
import { isValidTransferPair, transferDirectionFor } from "./transactions"

const at = "2026-01-10T12:00:00.000Z"

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "account-1",
    type: "debit",
    institution: "Bank",
    name: "Account",
    currency: "COP",
    initialBalance: 1_000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Account
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: crypto.randomUUID(),
    accountId: "account-1",
    kind: "expense",
    amount: 100,
    category: "Otro",
    occurredAt: at,
    ...overrides,
  }
}

describe("account balances", () => {
  it("adds income and subtracts expenses from debit accounts", () => {
    const result = accountBalance(account(), [
      tx({ kind: "income", amount: 250 }),
      tx({ kind: "expense", amount: 100 }),
    ])
    expect(result).toBe(1_150)
  })

  it("never turns a legacy negative expense into income", () => {
    expect(
      accountBalance(account(), [tx({ kind: "expense", amount: -100 })])
    ).toBe(900)
  })

  it("treats credit-card expenses as debt and payments as debt reduction", () => {
    const credit = account({
      type: "credit",
      initialBalance: 0,
      creditLimit: 2_000,
      last4: "1234",
      expDate: "01/30",
      network: "visa",
    })
    const transactions = [
      tx({ kind: "expense", amount: 300 }),
      tx({ kind: "income", amount: 50 }),
    ]
    expect(accountBalance(credit, transactions)).toBe(250)
    expect(netWorth([credit], transactions)).toBe(-250)
  })

  it("applies absolute adjustments chronologically and keeps later movements", () => {
    const investment = account({ type: "investment", initialBalance: 500 })
    const transactions = [
      tx({
        kind: "income",
        amount: 50,
        occurredAt: "2026-01-04T00:00:00.000Z",
      }),
      tx({
        kind: "adjustment",
        amount: 1_200,
        occurredAt: "2026-01-02T00:00:00.000Z",
      }),
      tx({
        kind: "expense",
        amount: 100,
        occurredAt: "2026-01-03T00:00:00.000Z",
      }),
      tx({
        kind: "income",
        amount: 900,
        occurredAt: "2026-01-01T12:00:00.000Z",
      }),
    ]
    expect(accountBalance(investment, transactions)).toBe(1_150)
  })

  it("excludes accounts and movements that did not exist at the requested date", () => {
    const createdLater = account({ createdAt: "2026-02-01T00:00:00.000Z" })
    expect(
      accountBalance(createdLater, [], new Date("2026-01-01T00:00:00.000Z"))
    ).toBe(0)
    expect(
      accountBalance(
        account(),
        [
          tx({
            kind: "income",
            amount: 500,
            occurredAt: "2026-03-01T00:00:00.000Z",
          }),
        ],
        new Date("2026-02-01T00:00:00.000Z")
      )
    ).toBe(1_000)
  })
})

describe("transfers", () => {
  it("keeps net worth unchanged for debit-to-credit payments", () => {
    const debit = account({ id: "debit", initialBalance: 1_000 })
    const credit = account({
      id: "credit",
      type: "credit",
      initialBalance: 200,
      creditLimit: 2_000,
      last4: "1234",
      expDate: "01/30",
      network: "visa",
    })
    const pair = "pair-1"
    const transactions = [
      tx({
        accountId: debit.id,
        kind: "transfer",
        direction: transferDirectionFor(debit.type, "source"),
        transferPairId: pair,
      }),
      tx({
        accountId: credit.id,
        kind: "transfer",
        direction: transferDirectionFor(credit.type, "destination"),
        transferPairId: pair,
      }),
    ]
    expect(accountBalance(debit, transactions)).toBe(900)
    expect(accountBalance(credit, transactions)).toBe(100)
    expect(netWorth([debit, credit], transactions)).toBe(800)
  })

  it("keeps net worth unchanged for a credit-card cash advance", () => {
    const credit = account({
      id: "credit",
      type: "credit",
      initialBalance: 200,
      creditLimit: 2_000,
      last4: "1234",
      expDate: "01/30",
      network: "visa",
    })
    const debit = account({ id: "debit", initialBalance: 1_000 })
    const transactions = [
      tx({
        accountId: credit.id,
        kind: "transfer",
        direction: transferDirectionFor(credit.type, "source"),
        transferPairId: "pair-2",
      }),
      tx({
        accountId: debit.id,
        kind: "transfer",
        direction: transferDirectionFor(debit.type, "destination"),
        transferPairId: "pair-2",
      }),
    ]
    expect(accountBalance(credit, transactions)).toBe(300)
    expect(accountBalance(debit, transactions)).toBe(1_100)
    expect(netWorth([credit, debit], transactions)).toBe(800)
  })

  it("validates matched directions and rejects cross-currency pairs", () => {
    const debit = account({ id: "debit" })
    const credit = account({
      id: "credit",
      type: "credit",
      creditLimit: 2_000,
      last4: "1234",
      expDate: "01/30",
      network: "visa",
    })
    const pair: [Transaction, Transaction] = [
      tx({
        accountId: debit.id,
        kind: "transfer",
        direction: "out",
        transferPairId: "pair-3",
      }),
      tx({
        accountId: credit.id,
        kind: "transfer",
        direction: "out",
        transferPairId: "pair-3",
      }),
    ]
    expect(isValidTransferPair(pair, [debit, credit])).toBe(true)
    expect(
      isValidTransferPair(pair, [debit, { ...credit, currency: "USD" }])
    ).toBe(false)
    expect(
      isValidTransferPair(
        [{ ...pair[0], direction: "in" }, pair[1]],
        [debit, credit]
      )
    ).toBe(false)
  })
})

describe("interest and currency arithmetic", () => {
  it("compounds fixed-income contributions and withdrawals independently", () => {
    const fixed = account({
      type: "fixed_income",
      initialBalance: 1_000,
      annualRate: 10,
      startDate: "2025-01-01T00:00:00.000Z",
    }) as FixedIncomeAccount
    const transactions = [
      tx({
        kind: "income",
        amount: 100,
        occurredAt: "2025-01-01T00:00:00.000Z",
      }),
      tx({
        kind: "expense",
        amount: 50,
        occurredAt: "2025-01-01T00:00:00.000Z",
      }),
      tx({
        kind: "income",
        amount: 999,
        occurredAt: "2027-01-01T00:00:00.000Z",
      }),
    ]
    expect(
      fixedIncomeBalance(
        fixed,
        transactions,
        new Date("2026-01-01T00:00:00.000Z")
      )
    ).toBeCloseTo(1_155, 8)
  })

  it("multiplies USD balances by the exchange rate", () => {
    expect(toBaseCurrency(10, "USD", 4_000)).toBe(40_000)
    expect(toBaseCurrency(10, "COP", 4_000)).toBe(10)
  })
})
