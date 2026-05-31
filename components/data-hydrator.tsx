"use client";
import { useEffect } from "react";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useCategoriesStore } from "@/lib/store/categories";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";

export function DataHydrator() {
  const hydrateAccounts = useAccountsStore((s) => s.hydrate);
  const hydrateTxs = useTransactionsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateCategories = useCategoriesStore((s) => s.hydrate);
  const hydrateExchangeRate = useExchangeRateStore((s) => s.hydrate);

  useEffect(() => {
    function hydrateAll() {
      // Each hydrate() is a no-op once its store is loaded, so this is cheap.
      void hydrateAccounts();
      void hydrateTxs();
      void hydrateSettings();
      void hydrateCategories();
      void hydrateExchangeRate();
    }

    hydrateAll();

    // Self-heal: if a load failed (e.g. DB was unreachable), keep retrying every
    // 10s until every store is loaded, then stop. Recovers without a manual reload.
    const interval = setInterval(() => {
      const allLoaded =
        useAccountsStore.getState().loaded &&
        useTransactionsStore.getState().loaded &&
        useSettingsStore.getState().loaded &&
        useCategoriesStore.getState().loaded &&
        useExchangeRateStore.getState().loaded;
      if (allLoaded) {
        clearInterval(interval);
        return;
      }
      hydrateAll();
    }, 10_000);

    return () => clearInterval(interval);
  }, [hydrateAccounts, hydrateTxs, hydrateSettings, hydrateCategories, hydrateExchangeRate]);

  return null;
}
