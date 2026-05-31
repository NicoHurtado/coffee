"use client";
import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { Account } from "@/lib/types";

const TYPE_ORDER: Record<string, number> = {
  credit: 0,
  debit: 1,
  fixed_income: 2,
  investment: 3,
};

function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort(
    (a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99),
  );
}

function deriveActive(accounts: Account[]): Account[] {
  return accounts.filter((a) => a.active !== false);
}

interface State {
  accounts: Account[];
  activeAccounts: Account[];
  loaded: boolean;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  add: (data: Omit<Account, "id" | "createdAt">) => Promise<Account>;
  update: (id: string, patch: Partial<Account>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Account | undefined;
}

export const useAccountsStore = create<State>()((set, get) => ({
  accounts: [],
  activeAccounts: [],
  loaded: false,
  isHydrating: false,
  hydrate: async () => {
    const { loaded, isHydrating } = get();
    if (loaded || isHydrating) return;
    set({ isHydrating: true });
    try {
      const res = await fetch("/api/accounts", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const all: Account[] = await res.json();
      const accounts = sortAccounts(all);
      set({ accounts, activeAccounts: deriveActive(accounts), loaded: true, isHydrating: false });
    } catch {
      // DB unreachable: don't crash the app — leave state empty and allow a retry.
      set({ isHydrating: false });
    }
  },
  refresh: async () => {
    set({ loaded: false, isHydrating: false });
    await get().hydrate();
  },
  add: async (data) => {
    // Optimistic: build the account locally and show it immediately.
    const id = uuid();
    const createdAt = new Date().toISOString();
    const full = { ...data, id, createdAt } as Account & { syncToken?: string };
    // Never keep the secret syncToken in client state.
    const { syncToken: _secret, ...local } = full;
    void _secret;
    const account = local as Account;
    const accounts = sortAccounts([...get().accounts, account]);
    set({ accounts, activeAccounts: deriveActive(accounts) });
    void fetch("/api/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(full),
    });
    return account;
  },
  update: async (id, patch) => {
    const accounts = get().accounts.map((a) =>
      a.id === id ? ({ ...a, ...patch } as Account) : a,
    );
    set({ accounts, activeAccounts: deriveActive(accounts) });
    await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
  },
  remove: async (id) => {
    const accounts = get().accounts.filter((a) => a.id !== id);
    set({ accounts, activeAccounts: deriveActive(accounts) });
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
  },
  getById: (id) => get().accounts.find((a) => a.id === id),
}));
