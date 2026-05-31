"use client";
import { useMemo } from "react";
import { startOfMonth, subMonths, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { computeAccountBalance } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

const config = {
  savingsRate: { label: "Tasa", color: "#27272a" },
} satisfies ChartConfig;

export function SavingsRunway() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);

  const data = useMemo(() => {
    const now = new Date();
    const months: {
      label: string;
      income: number;
      expense: number;
      savingsRate: number;
    }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const from = startOfMonth(monthDate);
      const to = endOfMonth(monthDate);
      const inRange = txs.filter((t) => {
        const d = new Date(t.occurredAt);
        return d >= from && d <= to;
      });
      const income = inRange
        .filter((t) => t.kind === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = inRange
        .filter((t) => t.kind === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const rate = income > 0 ? ((income - expense) / income) * 100 : 0;
      months.push({
        label: format(monthDate, "MMM", { locale: es }),
        income,
        expense,
        savingsRate: Math.max(-100, Math.min(100, rate)),
      });
    }
    return months;
  }, [txs]);

  const currentMonth = data[data.length - 1];
  const last6 = data.slice(-6);
  const avg6m =
    last6.length > 0
      ? last6.reduce((s, m) => s + m.savingsRate, 0) / last6.length
      : 0;

  // Runway: liquid assets / avg monthly expense (last 3 months)
  const liquidAssets = accounts.reduce((s, a) => {
    if (a.type === "credit") return s;
    return s + Math.max(0, computeAccountBalance(a, txs));
  }, 0);
  const last3 = data.slice(-3);
  const avgMonthlyExpense =
    last3.length > 0
      ? last3.reduce((s, m) => s + m.expense, 0) / last3.length
      : 0;
  const runwayMonths =
    avgMonthlyExpense > 0 ? liquidAssets / avgMonthlyExpense : Infinity;

  const rateColor = (rate: number) =>
    rate >= 30
      ? "text-emerald-600"
      : rate >= 10
        ? "text-amber-600"
        : "text-red-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Savings rate card */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tasa de ahorro
            </div>
            <div
              className={cn(
                "text-3xl font-bold tabular-nums mt-1",
                rateColor(currentMonth?.savingsRate ?? 0),
              )}
            >
              {(currentMonth?.savingsRate ?? 0).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Este mes · prom. 6m: {avg6m.toFixed(1)}%
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <div>
              <span className="text-emerald-600 font-medium">
                +{formatMoney(currentMonth?.income ?? 0, currency)}
              </span>{" "}
              ingresos
            </div>
            <div>
              <span className="text-red-500 font-medium">
                -{formatMoney(currentMonth?.expense ?? 0, currency)}
              </span>{" "}
              gastos
            </div>
          </div>
        </div>

        <ChartContainer config={config} className="h-32 w-full">
          <BarChart data={data} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              minTickGap={8}
            />
            <YAxis hide domain={[-100, 100]} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v) => `${Number(v).toFixed(1)}%`}
                />
              }
            />
            <Bar
              dataKey="savingsRate"
              radius={[3, 3, 0, 0]}
              fill="var(--color-savingsRate)"
            />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Runway card */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Runway (autonomía)
            </div>
            <div
              className={cn(
                "text-3xl font-bold tabular-nums mt-1",
                runwayMonths >= 12
                  ? "text-emerald-600"
                  : runwayMonths >= 6
                    ? "text-amber-600"
                    : "text-red-500",
              )}
            >
              {isFinite(runwayMonths) ? runwayMonths.toFixed(1) : "∞"} meses
            </div>
            <div className="text-xs text-muted-foreground">
              Sin ingresos al ritmo de gasto actual
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Activos líquidos
            </div>
            <div className="text-sm font-semibold tabular-nums mt-1">
              {formatMoney(liquidAssets, currency)}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Gasto promedio
            </div>
            <div className="text-sm font-semibold tabular-nums mt-1">
              {formatMoney(avgMonthlyExpense, currency)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              últimos 3 meses
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
