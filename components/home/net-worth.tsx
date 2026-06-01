"use client";
import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { netWorth, monthlyChangePct } from "@/lib/finance/net-worth";
import { formatMoney, formatPct } from "@/lib/finance/format";

export function NetWorth({ size = "xl" }: { size?: "xl" | "lg" }) {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const { total, pct } = useMemo(() => {
    const now = new Date();
    return {
      total: netWorth(accounts, txs, now, usdToCop),
      pct: monthlyChangePct(accounts, txs, now, usdToCop),
    };
  }, [accounts, txs, usdToCop]);
  const up = pct >= 0;
  const negative = total < 0;
  return (
    <div>
      <div
        className={`${size === "xl" ? "text-4xl" : "text-3xl"} font-bold tabular-nums ${negative ? "text-red-500" : ""}`}
      >
        {negative ? "-" : ""}
        {formatMoney(total, currency)}
      </div>
      <div
        className={`mt-1 text-sm flex items-center gap-1 ${up ? "text-emerald-500" : "text-red-500"}`}
      >
        {up ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
        {formatPct(pct)} este mes
      </div>
    </div>
  );
}
