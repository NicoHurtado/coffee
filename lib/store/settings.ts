"use client";
import { create } from "zustand";
import type { Currency } from "@/lib/types";

interface State {
  userName: string;
  defaultCurrency: Currency;
  lastUsedAccountId?: string;
  loaded: boolean;
  isHydrating: boolean;
  seed: (data: { userName: string; defaultCurrency: Currency; lastUsedAccountId?: string }) => void;
  hydrate: () => Promise<void>;
  setLastUsedAccount: (id: string) => Promise<void>;
}

export const useSettingsStore = create<State>()((set, get) => ({
  userName: "",
  defaultCurrency: "COP",
  lastUsedAccountId: undefined,
  loaded: false,
  isHydrating: false,
  seed: (data) => {
    // Server-prefetched data: skip if the client already loaded fresher state.
    if (get().loaded) return;
    set({
      userName: data.userName || get().userName,
      defaultCurrency: data.defaultCurrency ?? get().defaultCurrency,
      lastUsedAccountId: data.lastUsedAccountId,
      loaded: true,
    });
  },
  hydrate: async () => {
    const { loaded, isHydrating } = get();
    if (loaded || isHydrating) return;
    set({ isHydrating: true });
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({
        userName: data.userName || get().userName,
        defaultCurrency: data.defaultCurrency ?? get().defaultCurrency,
        lastUsedAccountId: data.lastUsedAccountId,
        loaded: true,
        isHydrating: false,
      });
    } catch {
      set({ isHydrating: false });
    }
  },
  setLastUsedAccount: async (lastUsedAccountId) => {
    set({ lastUsedAccountId });
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lastUsedAccountId }),
    });
  },
}));
