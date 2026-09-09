import { describe, expect, it } from "vitest"
import { parseTransaction } from "./transaction-validation"
import { normalizeTransaction } from "./transactions"

const valid = {
  id: "tx-1",
  accountId: "account-1",
  kind: "expense" as const,
  amount: 100,
  category: "Comida",
  occurredAt: "2026-01-01T00:00:00.000Z",
}

describe("transaction validation", () => {
  it("accepts a positive expense", () => {
    expect(parseTransaction(valid)).toEqual(valid)
  })

  it("rejects zero and negative movement amounts", () => {
    expect(() => parseTransaction({ ...valid, amount: 0 })).toThrow()
    expect(() => parseTransaction({ ...valid, amount: -100 })).toThrow()
  })

  it("rejects orphan transfer records", () => {
    expect(() => parseTransaction({ ...valid, kind: "transfer" })).toThrow()
  })

  it("repairs the sign of legacy movement amounts when they are read", () => {
    expect(normalizeTransaction({ ...valid, amount: -100 }).amount).toBe(100)
  })
})
