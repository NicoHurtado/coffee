"use client";
import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { netWorth } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "1M", days: 30, label: "1M" },
  { key: "3M", days: 90, label: "3M" },
  { key: "6M", days: 180, label: "6M" },
  { key: "1Y", days: 365, label: "1A" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const chartConfig = {
  value: { label: "Patrimonio", color: "var(--primary)" },
  income: { label: "Ingresos", color: "#10b981" },
  expense: { label: "Gastos", color: "#ef4444" },
} satisfies ChartConfig;

export function NetWorthChart() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const [range, setRange] = useState<RangeKey>("3M");

  const days = RANGES.find((r) => r.key === range)?.days ?? 90;
  const step = Math.max(1, Math.floor(days / 30));

  const data = useMemo(() => {
    type Item = { label: string; amount: number };
    const out: {
      ts: number;
      label: string;
      value: number;
      income: number;
      expense: number;
      incomeItems: Item[];
      expenseItems: Item[];
    }[] = [];
    const now = new Date();
    const stepMs = step * 24 * 60 * 60 * 1000;
    for (let i = days; i >= 0; i -= step) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const periodStart = new Date(d.getTime() - stepMs);
      const txsUntil = txs.filter((t) => new Date(t.occurredAt) <= d);
      const txsInPeriod = txs.filter((t) => {
        const td = new Date(t.occurredAt);
        return td > periodStart && td <= d;
      });
      const incomeTxs = txsInPeriod.filter((t) => t.kind === "income");
      const expenseTxs = txsInPeriod.filter((t) => t.kind === "expense");
      const income = incomeTxs.reduce((s, t) => s + t.amount, 0);
      const expense = expenseTxs.reduce((s, t) => s + t.amount, 0);
      const incomeItems = incomeTxs.map((t) => ({
        label: t.description || t.category,
        amount: t.amount,
      }));
      const expenseItems = expenseTxs.map((t) => ({
        label: t.description || t.category,
        amount: t.amount,
      }));
      out.push({
        ts: d.getTime(),
        label: format(d, days > 180 ? "MMM yyyy" : "d MMM", { locale: es }),
        value: netWorth(accounts, txsUntil, d, usdToCop),
        income,
        expense,
        incomeItems,
        expenseItems,
      });
    }
    return out;
  }, [accounts, txs, days, step]);

  if (accounts.length === 0) return null;

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;
  const up = delta >= 0;

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Patrimonio
          </div>
          <div className="text-xl font-semibold tabular-nums">
            {formatMoney(last, currency)}
          </div>
          <div className={cn("text-xs", up ? "text-emerald-600" : "text-red-500")}>
            {up ? "+" : "-"}
            {formatMoney(Math.abs(delta), currency)} ({deltaPct >= 0 ? "+" : ""}
            {deltaPct.toFixed(1)}%)
          </div>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition",
                range === r.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-foreground" />
          <span className="text-muted-foreground">Patrimonio</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: "#10b981" }} />
          <span className="text-muted-foreground">Ingresos</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: "#ef4444" }} />
          <span className="text-muted-foreground">Gastos</span>
        </span>
      </div>

      <ChartContainer config={chartConfig} className="h-56 w-full">
        <ComposedChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            minTickGap={32}
          />
          <YAxis yAxisId="patrimony" hide domain={["dataMin", "dataMax"]} />
          <YAxis yAxisId="flow" hide domain={[0, "dataMax"]} orientation="right" />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props) => {
              const payload = props.payload;
              if (!payload || payload.length === 0) return null;
              const d = payload[0]?.payload as
                | (typeof data)[number]
                | undefined;
              if (!d) return null;
              return (
                <div className="rounded-lg border bg-background shadow-md text-xs p-3 min-w-[220px] max-w-[280px] space-y-3">
                  <div className="font-medium">
                    {format(new Date(d.ts), "d MMM yyyy", { locale: es })}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-3 h-0.5 bg-foreground" /> Patrimonio
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(d.value, currency)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="size-2 rounded-sm"
                          style={{ background: "#10b981" }}
                        />
                        Ingresos
                      </span>
                      <span className="font-semibold tabular-nums text-emerald-600">
                        +{formatMoney(d.income, currency)}
                      </span>
                    </div>
                    {d.incomeItems.length > 0 && (
                      <ul className="pl-4 space-y-0.5 text-emerald-600">
                        {d.incomeItems.slice(0, 6).map((it, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{it.label}</span>
                            <span className="tabular-nums shrink-0">
                              +{formatMoney(it.amount, currency)}
                            </span>
                          </li>
                        ))}
                        {d.incomeItems.length > 6 && (
                          <li className="opacity-70">
                            +{d.incomeItems.length - 6} más…
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="size-2 rounded-sm"
                          style={{ background: "#ef4444" }}
                        />
                        Gastos
                      </span>
                      <span className="font-semibold tabular-nums text-red-500">
                        -{formatMoney(d.expense, currency)}
                      </span>
                    </div>
                    {d.expenseItems.length > 0 && (
                      <ul className="pl-4 space-y-0.5 text-red-500">
                        {d.expenseItems.slice(0, 6).map((it, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{it.label}</span>
                            <span className="tabular-nums shrink-0">
                              -{formatMoney(it.amount, currency)}
                            </span>
                          </li>
                        ))}
                        {d.expenseItems.length > 6 && (
                          <li className="opacity-70">
                            +{d.expenseItems.length - 6} más…
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Bar
            yAxisId="flow"
            dataKey="income"
            name="Ingresos"
            fill="#10b981"
            radius={[3, 3, 0, 0]}
            barSize={6}
          />
          <Bar
            yAxisId="flow"
            dataKey="expense"
            name="Gastos"
            fill="#ef4444"
            radius={[3, 3, 0, 0]}
            barSize={6}
          />
          <Line
            yAxisId="patrimony"
            type="monotone"
            dataKey="value"
            name="Patrimonio"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ChartContainer>
    </section>
  );
}
