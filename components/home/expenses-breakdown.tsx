"use client";
import { useMemo, useState } from "react";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useCategoriesStore } from "@/lib/store/categories";
import { getCategoryIcon, getCategoryColor } from "@/lib/finance/categories";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RANGES = [
  { key: "month", label: "Este mes" },
  { key: "prev", label: "Mes pasado" },
  { key: "3m", label: "3 meses" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

export function ExpensesBreakdown() {
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const categories = useCategoriesStore((s) => s.categories);
  const [range, setRange] = useState<RangeKey>("month");

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (range === "prev") {
      const m = subMonths(now, 1);
      return { from: startOfMonth(m), to: endOfMonth(m) };
    }
    if (range === "3m") {
      return { from: startOfMonth(subMonths(now, 2)), to: now };
    }
    return { from: startOfMonth(now), to: now };
  }, [range]);

  const totals = useMemo(() => {
    const m = new Map<string, number>();
    categories.forEach((c) => m.set(c.name, 0));
    txs
      .filter((t) => {
        if (t.kind !== "expense") return false;
        const d = new Date(t.occurredAt);
        return d >= from && d <= to;
      })
      .forEach((t) => m.set(t.category, (m.get(t.category) ?? 0) + t.amount));
    return [...m.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));
  }, [txs, from, to, categories]);

  const total = totals.reduce((s, c) => s + c.amount, 0);

  return (
    <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-3 xl:flex-1">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Gastos por categoría
          </div>
          <div className="text-xl font-semibold tabular-nums">
            {formatMoney(total, currency)}
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

      {total === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          Sin gastos en el período.
        </div>
      ) : (
        <>
          <TooltipProvider delayDuration={80}>
            <div className="flex h-3.5 w-full rounded-sm overflow-hidden bg-muted">
              {totals.map((c) => {
                const pct = (c.amount / total) * 100;
                const Icon = getCategoryIcon(c.category);
                return (
                  <Tooltip key={c.category}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        style={{ width: `${pct}%`, background: getCategoryColor(c.category) }}
                        className="h-full transition-all hover:brightness-110 hover:scale-y-125 focus:outline-none"
                        aria-label={`${c.category}: ${formatMoney(c.amount, currency)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: getCategoryColor(c.category) }}
                        />
                        <Icon className="size-3.5" />
                        <span className="font-semibold">{c.category}</span>
                      </div>
                      <div className="mt-1 tabular-nums text-sm">
                        {formatMoney(c.amount, currency)}{" "}
                        <span className="text-muted-foreground">({pct.toFixed(1)}%)</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 pt-1">
            {totals.map((c) => {
              const Icon = getCategoryIcon(c.category);
              const pct = (c.amount / total) * 100;
              return (
                <div key={c.category} className="flex items-center justify-between gap-2 text-sm min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ background: getCategoryColor(c.category) }}
                    />
                    <Icon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-[11px] uppercase tracking-wider">{c.category}</span>
                  </div>
                  <div className="text-xs tabular-nums shrink-0">
                    <span className="font-semibold">{formatMoney(c.amount, currency)}</span>
                    <span className="text-muted-foreground ml-1.5">{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
