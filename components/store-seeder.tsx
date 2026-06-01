"use client";
import { useEffect } from "react";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useCategoriesStore } from "@/lib/store/categories";
import type { Account, Transaction } from "@/lib/types";
import type { CategoryData, SettingsData } from "@/lib/db/queries";

export interface InitialData {
  accounts: Account[];
  transactions: Transaction[];
  settings: SettingsData;
  categories: CategoryData[];
}

/**
 * Seeds the Zustand stores from data the server already fetched and embedded in
 * the initial HTML — no client fetch round-trip, no auth revalidation, no DB
 * wait. Runs once on mount, synchronously from in-memory props.
 *
 * Seeding happens in an effect (client-only) rather than during render: the
 * module-level stores are shared across requests on the server, and seeding
 * during render would also diverge from the empty-store SSR output and trip a
 * hydration mismatch. The effect runs right after the first commit and fills
 * the stores from in-memory props — no network, far ahead of any fetch.
 * Each store's seed() is a no-op once loaded, so a later optimistic client
 * write is never clobbered.
 */
export function StoreSeeder({ data }: { data: InitialData }) {
  useEffect(() => {
    useAccountsStore.getState().seed(data.accounts);
    useTransactionsStore.getState().seed(data.transactions);
    useSettingsStore.getState().seed(data.settings);
    useCategoriesStore.getState().seed(data.categories);
    // Seed once with the data present at mount; intentionally not reactive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
