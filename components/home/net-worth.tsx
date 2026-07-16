"use client";
import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { netWorth, monthlyChangePct, liquidNetWorth, investmentsTotal } from "@/lib/finance/net-worth";
import { formatMoney, formatPct } from "@/lib/finance/format";

export function NetWorth({ size = "xl" }: { size?: "xl" | "lg" }) {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const { total, pct, liquid, inv } = useMemo(() => {
    const now = new Date();
    return {
      total: netWorth(accounts, txs, now, usdToCop),
      pct: monthlyChangePct(accounts, txs, now, usdToCop),
      liquid: liquidNetWorth(accounts, txs, now, usdToCop),
      inv: investmentsTotal(accounts, txs, now, usdToCop),
    };
  }, [accounts, txs, usdToCop]);
  const up = pct >= 0;
  const negative = total < 0;
  return (
    <div>
      <div
        className={`${size === "xl" ? "text-4xl" : "text-3xl"} font-bold tabular-nums ${negative ? "text-destructive" : ""}`}
      >
        {negative ? "-" : ""}
        {formatMoney(total, currency)}
      </div>
      <div
        className={`mt-1 text-sm flex items-center gap-1 ${up ? "text-primary" : "text-destructive"}`}
      >
        {up ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
        {formatPct(pct)} este mes
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Patrimonio líquido
          </div>
          <div className="text-sm font-semibold tabular-nums mt-0.5">
            {liquid < 0 ? "-" : ""}
            {formatMoney(liquid, currency)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Inversiones bolsa
          </div>
          <div className="text-sm font-semibold tabular-nums mt-0.5">
            {formatMoney(inv.cop, currency)}
            {inv.usd > 0 && (
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                ${inv.usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
