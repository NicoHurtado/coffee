"use client";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { computeAccountBalance, toBaseCurrency } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import { useCategoriesStore } from "@/lib/store/categories";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { cn } from "@/lib/utils";
import { SavingsRunway } from "@/components/analysis/savings-runway";
import { SpendingHeatmap } from "@/components/analysis/spending-heatmap";
import { RecurringSubscriptions } from "@/components/analysis/recurring-subscriptions";
import { CategoryMonthDiff } from "@/components/analysis/category-month-diff";
import { NetWorthComposition } from "@/components/analysis/net-worth-composition";
import { PageHeader } from "@/components/nav/page-header";

const TYPE_LABEL = {
  debit: "Débito",
  credit: "Crédito",
  fixed_income: "Renta Fija",
  investment: "Inversiones",
} as const;

const TYPE_COLOR = {
  debit: "#16c784", // emerald (liquidez)
  fixed_income: "#4f9bb0", // steel blue (renta fija)
  investment: "#c79a4b", // muted amber (inversión)
  credit: "#ea3943", // strong red (deuda)
} as const;

const distributionConfig = {
  value: { label: "Total" },
  debit: { label: "Débito", color: TYPE_COLOR.debit },
  credit: { label: "Crédito", color: TYPE_COLOR.credit },
  fixed_income: { label: "Renta Fija", color: TYPE_COLOR.fixed_income },
  investment: { label: "Inversiones", color: TYPE_COLOR.investment },
} satisfies ChartConfig;

const categoryConfig = {
  amount: { label: "Monto", color: "var(--primary)" },
} satisfies ChartConfig;

const monthlyConfig = {
  income: { label: "Ingresos", color: "var(--primary)" },
  expense: { label: "Gastos", color: "var(--destructive)" },
} satisfies ChartConfig;

export default function AnalisisPage() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const categories = useCategoriesStore((s) => s.categories);
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const [monthsBack, setMonthsBack] = useState(6);

  // Distribution by account type (assets only — credit is debt, excluded)
  const distribution = useMemo(() => {
    const totals: Record<string, number> = {
      debit: 0,
      fixed_income: 0,
      investment: 0,
    };
    accounts.forEach((a) => {
      if (a.type === "credit") return; // deuda, no es activo
      totals[a.type] += Math.max(0, toBaseCurrency(computeAccountBalance(a, txs), a.currency, usdToCop));
    });
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        key,
        name: TYPE_LABEL[key as keyof typeof TYPE_LABEL],
        value,
      }));
  }, [accounts, txs, usdToCop]);

  const totalAssets = distribution.reduce((s, d) => s + d.value, 0);

  // Top expense categories in selected window
  const fromDate = useMemo(
    () => startOfMonth(subMonths(new Date(), monthsBack - 1)),
    [monthsBack],
  );

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((c) => map.set(c.name, 0));
    txs
      .filter((t) => t.kind === "expense" && new Date(t.occurredAt) >= fromDate)
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
  }, [txs, fromDate, categories]);

  const totalExpenses = categoryTotals.reduce((s, d) => s + d.amount, 0);

  // Monthly income vs expense
  const monthly = useMemo(() => {
    const buckets = new Map<string, { month: string; ts: number; income: number; expense: number }>();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = startOfMonth(subMonths(new Date(), i));
      const key = format(d, "yyyy-MM");
      buckets.set(key, {
        month: format(d, "MMM yy", { locale: es }),
        ts: d.getTime(),
        income: 0,
        expense: 0,
      });
    }
    txs.forEach((t) => {
      const d = new Date(t.occurredAt);
      if (d < fromDate) return;
      const key = format(startOfMonth(d), "yyyy-MM");
      const b = buckets.get(key);
      if (!b) return;
      if (t.kind === "income") b.income += t.amount;
      else if (t.kind === "expense") b.expense += t.amount;
    });
    return [...buckets.values()];
  }, [txs, monthsBack, fromDate]);

  const totalIncome = monthly.reduce((s, m) => s + m.income, 0);
  const netFlow = totalIncome - totalExpenses;

  const ranges = [3, 6, 12];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="Inteligencia"
        title="Análisis"
        subtitle="Distribución de activos, gastos por categoría y flujo mensual."
      >
        <div className="flex gap-0.5 border bg-card p-0.5 rounded-md">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMonthsBack(r)}
              className={cn(
                "px-3 py-1.5 rounded-sm text-[10px] font-semibold uppercase tracking-[0.1em] transition",
                monthsBack === r
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {r === 12 ? "1 año" : `${r} meses`}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Salud financiera */}
      <SavingsRunway />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground tabular-nums">Activos totales</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{formatMoney(totalAssets, currency)}</div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground tabular-nums">Ingresos del período</div>
          <div className="text-2xl font-bold tabular-nums text-primary mt-1">
            +{formatMoney(totalIncome, currency)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground tabular-nums">Gastos del período</div>
          <div className="text-2xl font-bold tabular-nums text-destructive mt-1">
            -{formatMoney(totalExpenses, currency)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground tabular-nums">Flujo neto</div>
          <div
            className={cn(
              "text-2xl font-bold tabular-nums mt-1",
              netFlow >= 0 ? "text-primary" : "text-destructive",
            )}
          >
            {netFlow >= 0 ? "+" : "-"}
            {formatMoney(Math.abs(netFlow), currency)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Distribution donut */}
        <div className="col-span-12 xl:col-span-5 rounded-lg border bg-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">Distribución de activos</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Cómo se reparte tu patrimonio entre tipos de cuenta.
          </p>
          {distribution.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              Sin datos suficientes.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <ChartContainer config={distributionConfig} className="h-56 w-56 shrink-0">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => formatMoney(Number(v), currency)}
                      />
                    }
                  />
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    strokeWidth={2}
                  >
                    {distribution.map((d) => (
                      <Cell
                        key={d.key}
                        fill={TYPE_COLOR[d.key as keyof typeof TYPE_COLOR]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex-1 min-w-0 space-y-2">
                {distribution.map((d) => (
                  <div key={d.key} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{
                          background: TYPE_COLOR[d.key as keyof typeof TYPE_COLOR],
                        }}
                      />
                      <span className="truncate">{d.name}</span>
                    </div>
                    <div className="text-sm tabular-nums text-right shrink-0">
                      <span className="font-semibold">{formatMoney(d.value, currency)}</span>
                      <span className="text-muted-foreground ml-2">
                        {((d.value / totalAssets) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Categories bar */}
        <div className="col-span-12 xl:col-span-7 rounded-lg border bg-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">Gastos por categoría</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Total acumulado en el período seleccionado.
          </p>
          {categoryTotals.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              Sin gastos en el período.
            </div>
          ) : (
            <ChartContainer config={categoryConfig} className="h-64 w-full">
              <BarChart data={categoryTotals} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => formatMoney(Number(v), currency)}
                    />
                  }
                />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        {/* Monthly income vs expense */}
        <div className="col-span-12 rounded-lg border bg-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-1">Ingresos vs Gastos por mes</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Comparativa mensual del flujo de dinero.
          </p>
          <ChartContainer config={monthlyConfig} className="h-72 w-full">
            <BarChart data={monthly}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={80} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(v) => formatMoney(Number(v), currency)}
                  />
                }
              />
              <Bar dataKey="income" fill="var(--color-income)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="var(--color-expense)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Composición del patrimonio en el tiempo */}
      <NetWorthComposition />

      {/* Calendario de gastos (heatmap) */}
      <SpendingHeatmap />

      {/* Suscripciones recurrentes + Diff vs mes pasado */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecurringSubscriptions />
        <CategoryMonthDiff />
      </div>
    </div>
  );
}
