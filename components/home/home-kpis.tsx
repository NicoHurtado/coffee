"use client";
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { startOfMonth } from "date-fns";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { netWorth, monthlyChangePct } from "@/lib/finance/net-worth";
import { formatMoney, formatPct } from "@/lib/finance/format";
import { KpiCard } from "./kpi-card";

export function HomeKpis() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);

  const nw = netWorth(accounts, txs, new Date(), usdToCop);
  const pct = monthlyChangePct(accounts, txs, new Date(), usdToCop);

  const monthStart = startOfMonth(new Date());
  const monthTxs = txs.filter((t) => new Date(t.occurredAt) >= monthStart);
  const expensesMonth = monthTxs
    .filter((t) => t.kind === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const incomeMonth = monthTxs
    .filter((t) => t.kind === "income")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Patrimonio neto"
        value={formatMoney(nw, currency)}
        delta={`${formatPct(pct)} este mes`}
        icon={Wallet}
        tone={pct >= 0 ? "up" : "down"}
      />
      <KpiCard
        label="Ingresos del mes"
        value={`+${formatMoney(incomeMonth, currency)}`}
        icon={ArrowUpRight}
        valueTone="up"
      />
      <KpiCard
        label="Gastos del mes"
        value={`-${formatMoney(expensesMonth, currency)}`}
        icon={ArrowDownRight}
        valueTone="down"
      />
      <KpiCard
        label="Cuentas activas"
        value={String(accounts.length)}
        delta={`${monthTxs.length} mov. este mes`}
        icon={TrendingUp}
      />
    </div>
  );
}
