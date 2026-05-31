"use client";
import { create } from "zustand";

const STORAGE_KEY = "coffee_trm";
const today = () => new Date().toISOString().slice(0, 10);

interface Cached { rate: number; date: string; fetchedOn: string }

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: Cached = JSON.parse(raw);
    if (parsed.fetchedOn === today()) return parsed;
    return null;
  } catch { return null; }
}

function writeCache(rate: number, date: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate, date, fetchedOn: today() }));
  } catch { /* ignore */ }
}

interface State {
  usdToCop: number | null;
  trmDate: string | null;
  loaded: boolean;
  hydrate: () => Promise<void>;
}

export const useExchangeRateStore = create<State>()((set) => ({
  usdToCop: null,
  trmDate: null,
  loaded: false,
  hydrate: async () => {
    // Use cached value if already fetched today
    const cached = readCache();
    if (cached) {
      set({ usdToCop: cached.rate, trmDate: cached.date, loaded: true });
      return;
    }
    try {
      const res = await fetch("/api/exchange-rate", { cache: "no-store" });
      const data = await res.json();
      if (data.rate) {
        writeCache(data.rate, data.date ?? today());
        set({ usdToCop: data.rate, trmDate: data.date ?? null, loaded: true });
      } else {
        set({ usdToCop: null, trmDate: null, loaded: true });
      }
    } catch {
      set({ usdToCop: null, trmDate: null, loaded: true });
    }
  },
}));
