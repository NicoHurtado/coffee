import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useAccountsStore } from "./accounts"
import type { Account } from "../types"

const account: Account = {
  id: "debit-1",
  type: "debit",
  name: "Mi tarjeta",
  institution: "Banco",
  currency: "COP",
  initialBalance: 100,
  createdAt: "2026-01-01",
}

beforeEach(() => {
  useAccountsStore.setState({
    accounts: [],
    activeAccounts: [],
    loaded: false,
    isHydrating: false,
  })
  useAccountsStore.getState().seed([account])
})
afterEach(() => vi.unstubAllGlobals())

describe("Home account visibility", () => {
  it("keeps existing accounts visible by default", () => {
    expect(useAccountsStore.getState().activeAccounts[0].showOnHome).not.toBe(
      false
    )
  })

  it("persists visibility without removing the account or changing its balance", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ ...account, showOnHome: false }))
    vi.stubGlobal("fetch", fetchMock)
    await useAccountsStore.getState().setHomeVisibility(account.id, false)
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/accounts/${account.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ showOnHome: false }),
      })
    )
    expect(useAccountsStore.getState().activeAccounts).toEqual([
      { ...account, showOnHome: false },
    ])

    fetchMock.mockResolvedValue(
      Response.json([{ ...account, showOnHome: false }])
    )
    await useAccountsStore.getState().refresh()
    expect(useAccountsStore.getState().activeAccounts[0].showOnHome).toBe(false)

    fetchMock.mockResolvedValue(Response.json({ ...account, showOnHome: true }))
    await useAccountsStore.getState().setHomeVisibility(account.id, true)
    expect(useAccountsStore.getState().activeAccounts[0].showOnHome).toBe(true)
  })

  it.each([500, 401])(
    "preserves visibility if saving fails with %s",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status }))
      )
      await expect(
        useAccountsStore.getState().setHomeVisibility(account.id, false)
      ).rejects.toThrow()
      expect(useAccountsStore.getState().activeAccounts).toEqual([account])
    }
  )

  it("does not report success for a missing account", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(null)))
    await expect(
      useAccountsStore.getState().setHomeVisibility(account.id, false)
    ).rejects.toThrow()
    expect(useAccountsStore.getState().activeAccounts).toEqual([account])
  })
})
