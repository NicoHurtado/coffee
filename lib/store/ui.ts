"use client";
import { create } from "zustand";
import type { TransactionKind } from "@/lib/types";

interface QuickAddPrefill {
  accountId?: string;
  kind?: TransactionKind;
}

interface State {
  quickAddOpen: boolean;
  prefill: QuickAddPrefill;
  openQuickAdd: (prefill?: QuickAddPrefill) => void;
  closeQuickAdd: () => void;
}

export const useUIStore = create<State>((set) => ({
  quickAddOpen: false,
  prefill: {},
  openQuickAdd: (prefill = {}) => set({ quickAddOpen: true, prefill }),
  closeQuickAdd: () => set({ quickAddOpen: false, prefill: {} }),
}));
