"use client";
import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useCategoriesStore } from "@/lib/store/categories";
import { formatMoney } from "@/lib/finance/format";

// Scale based on #8E8E93 — alternates dark & light for max contrast.
const MONO_SHADES = [
  "#1c1c1d",
  "#d2d2d4",
  "#47474a",
  "#b0b0b3",
  "#555558",
  "#8e8e93",
  "#c7c7c9",
  "#1c1c1d",
  "#d2d2d4",
  "#47474a",
  "#b0b0b3",
] as const;

export function AccountCategoryPie({ accountId }: { accountId: string }) {
  const txs = useTransactionsStore((s) => s.forAccount(accountId));
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const categories = useCategoriesStore((s) => s.categories);

  const config = Object.fromEntries(
    categories.map((c) => [c.name, { label: c.name }]),
  ) as ChartConfig;

  const data = useMemo(() => {
    const m = new Map<string, number>();
    txs
      .filter((t) => t.kind === "expense")
      .forEach((t) => m.set(t.category, (m.get(t.category) ?? 0) + t.amount));
    return [...m.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt], i) => ({
        name: cat,
        value: amt,
        fill: MONO_SHADES[i] ?? MONO_SHADES[MONO_SHADES.length - 1],
      }));
  }, [txs, accountId]);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-4 space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Gastos por categoría
        </div>
        <div className="text-sm text-muted-foreground py-6 text-center">
          Sin gastos en esta cuenta.
        </div>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl border bg-card p-4 flex flex-col gap-3 h-full">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Gastos por categoría
      </div>
      <div className="flex items-center gap-4 flex-1">
        <ChartContainer config={config} className="h-56 w-56 shrink-0">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v) => formatMoney(Number(v), currency)}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex-1 min-w-0 space-y-1.5">
          {data.slice(0, 6).map((d) => (
            <div
              key={d.name}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ background: d.fill }}
                />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="tabular-nums shrink-0">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          {data.length > 6 && (
            <div className="text-[10px] text-muted-foreground">
              +{data.length - 6} más
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
