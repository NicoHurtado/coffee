"use client";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "day", label: "Día", days: 30 },
  { key: "week", label: "Semana", days: 84 },
  { key: "month", label: "Mes", days: 365 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const config = {
  expense: { label: "Gastos", color: "#27272a" },
} satisfies ChartConfig;

export function AccountPeriodBars({ accountId }: { accountId: string }) {
  const txs = useTransactionsStore((s) => s.forAccount(accountId));
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const [range, setRange] = useState<RangeKey>("month");

  const data = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range)!;
    const cutoff = new Date(Date.now() - cfg.days * 24 * 60 * 60 * 1000);
    const buckets = new Map<string, { ts: number; label: string; expense: number }>();

    const bucketKey = (d: Date) => {
      const b =
        range === "day"
          ? startOfDay(d)
          : range === "week"
            ? startOfWeek(d, { weekStartsOn: 1 })
            : startOfMonth(d);
      return {
        key: b.toISOString(),
        ts: b.getTime(),
        label:
          range === "month"
            ? format(b, "MMM yy", { locale: es })
            : format(b, "d MMM", { locale: es }),
      };
    };

    txs
      .filter(
        (t) =>
          t.kind === "expense" &&
          new Date(t.occurredAt) >= cutoff,
      )
      .forEach((t) => {
        const { key, ts, label } = bucketKey(new Date(t.occurredAt));
        const cur = buckets.get(key) ?? { ts, label, expense: 0 };
        cur.expense += t.amount;
        buckets.set(key, cur);
      });

    return [...buckets.values()].sort((a, b) => a.ts - b.ts);
  }, [txs, accountId, range]);

  return (
    <div className="rounded-2xl border bg-card p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Gastos por período
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition",
                range === r.key
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          Sin gastos en este rango.
        </div>
      ) : (
        <ChartContainer config={config} className="flex-1 min-h-[200px] w-full">
          <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              minTickGap={20}
            />
            <YAxis hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v) => formatMoney(Number(v), currency)}
                />
              }
            />
            <Bar
              dataKey="expense"
              fill="var(--color-expense)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
