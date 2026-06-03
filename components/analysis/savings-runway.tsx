"use client";
import { useMemo } from "react";
import {
  startOfMonth,
  subMonths,
  endOfMonth,
  subDays,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { Bar, BarChart, Cell, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { computeAccountBalance, netWorth } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

const DAYS = 30;
const UP = "var(--primary)";
const DOWN = "var(--destructive)";

const config = {
  body: { label: "Patrimonio" },
  wick: { label: "Rango" },
} satisfies ChartConfig;

function compact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
}

export function SavingsRunway() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);

  // Daily candlesticks: each day's candle runs from the opening net worth
  // (previous close) to the closing net worth (after that day's flows).
  // Upper wick = gross income, lower wick = gross expense. Green if the day
  // closed up (net positive), red if it closed down.
  const candles = useMemo(() => {
    const now = new Date();
    const firstDay = subDays(now, DAYS - 1);

    const flows = new Map<string, { income: number; expense: number }>();
    for (let i = DAYS - 1; i >= 0; i--) {
      flows.set(format(subDays(now, i), "yyyy-MM-dd"), { income: 0, expense: 0 });
    }
    for (const t of txs) {
      const key = format(new Date(t.occurredAt), "yyyy-MM-dd");
      const f = flows.get(key);
      if (!f) continue;
      if (t.kind === "income") f.income += t.amount;
      else if (t.kind === "expense") f.expense += t.amount;
    }

    // Opening net worth = total as of the day before the window starts.
    let open = netWorth(accounts, txs, subDays(firstDay, 1), usdToCop);

    return [...flows.entries()].map(([key, f]) => {
      const close = open + f.income - f.expense;
      const high = open + f.income; // best-case intraday
      const low = open - f.expense; // worst-case intraday
      const up = close >= open;
      const row = {
        key,
        label: format(new Date(key), "EEE d MMM", { locale: es }),
        short: format(new Date(key), "d"),
        income: f.income,
        expense: f.expense,
        open,
        close,
        up,
        wick: [low, high] as [number, number],
        body: [Math.min(open, close), Math.max(open, close)] as [number, number],
      };
      open = close;
      return row;
    });
  }, [accounts, txs, usdToCop]);

  const totals = useMemo(() => {
    const income = candles.reduce((s, d) => s + d.income, 0);
    const expense = candles.reduce((s, d) => s + d.expense, 0);
    return { income, expense, net: income - expense };
  }, [candles]);

  const yDomain = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of candles) {
      lo = Math.min(lo, c.wick[0]);
      hi = Math.max(hi, c.wick[1]);
    }
    if (!isFinite(lo)) return [0, 1] as [number, number];
    const pad = (hi - lo) * 0.08 || 1;
    return [lo - pad, hi + pad] as [number, number];
  }, [candles]);

  // Monthly expense average (last 3 full months) for the runway card.
  const monthly = useMemo(() => {
    const now = new Date();
    const out: { expense: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const md = subMonths(now, i);
      const from = startOfMonth(md);
      const to = endOfMonth(md);
      const expense = txs
        .filter((t) => {
          const d = new Date(t.occurredAt);
          return t.kind === "expense" && d >= from && d <= to;
        })
        .reduce((s, t) => s + t.amount, 0);
      out.push({ expense });
    }
    return out;
  }, [txs]);

  const liquidAssets = accounts.reduce((s, a) => {
    if (a.type === "credit") return s;
    return s + Math.max(0, computeAccountBalance(a, txs));
  }, 0);
  const avgMonthlyExpense =
    monthly.length > 0
      ? monthly.reduce((s, m) => s + m.expense, 0) / monthly.length
      : 0;
  const runwayMonths =
    avgMonthlyExpense > 0 ? liquidAssets / avgMonthlyExpense : Infinity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Daily candlesticks */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Flujo diario · velas
            </div>
            <div className="text-3xl font-bold tabular-nums mt-1">
              <span className={totals.net >= 0 ? "text-primary" : "text-destructive"}>
                {totals.net >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(totals.net), currency)}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              Neto · últimos {DAYS} días
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground space-y-0.5 tabular-nums">
            <div>
              <span className="text-primary font-semibold">
                +{formatMoney(totals.income, currency)}
              </span>{" "}
              ingresos
            </div>
            <div>
              <span className="text-destructive font-semibold">
                -{formatMoney(totals.expense, currency)}
              </span>{" "}
              gastos
            </div>
          </div>
        </div>

        <ChartContainer config={config} className="h-44 w-full">
          <BarChart data={candles} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={-3.5}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="short"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              interval={4}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={compact}
              tickLine={false}
              axisLine={false}
              width={42}
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--accent)", opacity: 0.4 }}
              content={(props) => {
                const p = props.payload;
                if (!p || p.length === 0) return null;
                const d = p[0]?.payload as (typeof candles)[number] | undefined;
                if (!d) return null;
                return (
                  <div className="rounded-md border bg-background shadow-md text-xs p-3 min-w-[200px] space-y-1.5">
                    <div className="font-medium capitalize">{d.label}</div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Apertura</span>
                      <span className="font-semibold tabular-nums">{formatMoney(d.open, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Cierre</span>
                      <span className={cn("font-semibold tabular-nums", d.up ? "text-primary" : "text-destructive")}>
                        {formatMoney(d.close, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t pt-1.5">
                      <span className="text-muted-foreground">Ingresos</span>
                      <span className="font-semibold tabular-nums text-primary">+{formatMoney(d.income, currency)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Gastos</span>
                      <span className="font-semibold tabular-nums text-destructive">-{formatMoney(d.expense, currency)}</span>
                    </div>
                  </div>
                );
              }}
            />
            {/* wick (high-low) */}
            <Bar dataKey="wick" barSize={1.5} isAnimationActive={false}>
              {candles.map((c) => (
                <Cell key={c.key} fill={c.up ? UP : DOWN} />
              ))}
            </Bar>
            {/* body (open-close) */}
            <Bar dataKey="body" barSize={7} radius={1} isAnimationActive={false}>
              {candles.map((c) => (
                <Cell key={c.key} fill={c.up ? UP : DOWN} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Runway card */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Runway (autonomía)
            </div>
            <div
              className={cn(
                "text-3xl font-bold tabular-nums mt-1",
                runwayMonths >= 12
                  ? "text-primary"
                  : runwayMonths >= 6
                    ? "text-amber-600"
                    : "text-destructive",
              )}
            >
              {isFinite(runwayMonths) ? runwayMonths.toFixed(1) : "∞"} meses
            </div>
            <div className="text-[11px] text-muted-foreground">
              Sin ingresos al ritmo de gasto actual
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-md border p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Activos líquidos
            </div>
            <div className="text-sm font-semibold tabular-nums mt-1">
              {formatMoney(liquidAssets, currency)}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Gasto promedio
            </div>
            <div className="text-sm font-semibold tabular-nums mt-1">
              {formatMoney(avgMonthlyExpense, currency)}
            </div>
            <div className="text-[10px] text-muted-foreground">últimos 3 meses</div>
          </div>
        </div>
      </div>
    </div>
  );
}
