"use client";
import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useCategoriesStore } from "@/lib/store/categories";
import { getCategoryIcon } from "@/lib/finance/categories";
import { formatMoney } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export function CategoryMonthDiff() {
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const categories = useCategoriesStore((s) => s.categories);

  const rows = useMemo(() => {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    const lastEnd = endOfMonth(subMonths(now, 1));

    const inRange = (d: Date, from: Date, to: Date) => d >= from && d <= to;

    const thisMonth = new Map<string, number>();
    const lastMonth = new Map<string, number>();
    categories.forEach((c) => {
      thisMonth.set(c.name, 0);
      lastMonth.set(c.name, 0);
    });

    txs
      .filter((t) => t.kind === "expense")
      .forEach((t) => {
        const d = new Date(t.occurredAt);
        if (inRange(d, thisStart, thisEnd)) {
          thisMonth.set(t.category, (thisMonth.get(t.category) ?? 0) + t.amount);
        } else if (inRange(d, lastStart, lastEnd)) {
          lastMonth.set(t.category, (lastMonth.get(t.category) ?? 0) + t.amount);
        }
      });

    return categories.map((c) => {
      const tNow = thisMonth.get(c.name) ?? 0;
      const tPrev = lastMonth.get(c.name) ?? 0;
      const diff = tNow - tPrev;
      const pct = tPrev > 0 ? (diff / tPrev) * 100 : tNow > 0 ? 100 : 0;
      return { category: c.name, thisMonth: tNow, lastMonth: tPrev, diff, pct };
    })
      .filter((r) => r.thisMonth > 0 || r.lastMonth > 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [txs, categories]);

  const totalThis = rows.reduce((s, r) => s + r.thisMonth, 0);
  const totalLast = rows.reduce((s, r) => s + r.lastMonth, 0);
  const totalDiff = totalThis - totalLast;
  const totalPct = totalLast > 0 ? (totalDiff / totalLast) * 100 : 0;

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Diferencia vs mes pasado
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">
            {formatMoney(totalThis, currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            Mes pasado: {formatMoney(totalLast, currency)}
          </div>
        </div>
        <div
          className={cn(
            "text-sm font-semibold tabular-nums flex items-center gap-1",
            totalDiff > 0 ? "text-red-500" : totalDiff < 0 ? "text-emerald-600" : "text-muted-foreground",
          )}
        >
          {totalDiff > 0 ? (
            <ArrowUpRight className="size-4" />
          ) : totalDiff < 0 ? (
            <ArrowDownRight className="size-4" />
          ) : (
            <Minus className="size-4" />
          )}
          {totalDiff > 0 ? "+" : ""}
          {formatMoney(Math.abs(totalDiff), currency)} ({totalPct >= 0 ? "+" : ""}
          {totalPct.toFixed(0)}%)
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          Sin gastos para comparar.
        </div>
      ) : (
        <div className="divide-y">
          {rows.map((r) => {
            const Icon = getCategoryIcon(r.category);
            const isUp = r.diff > 0;
            const isDown = r.diff < 0;
            return (
              <div
                key={r.category}
                className="flex items-center gap-3 py-2.5"
              >
                <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.category}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {formatMoney(r.thisMonth, currency)} ·{" "}
                    <span className="opacity-70">
                      antes {formatMoney(r.lastMonth, currency)}
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold tabular-nums shrink-0 flex items-center gap-1",
                    isUp && "text-red-500",
                    isDown && "text-emerald-600",
                    !isUp && !isDown && "text-muted-foreground",
                  )}
                >
                  {isUp && <ArrowUpRight className="size-3.5" />}
                  {isDown && <ArrowDownRight className="size-3.5" />}
                  {isUp ? "+" : isDown ? "-" : ""}
                  {formatMoney(Math.abs(r.diff), currency)}
                  <span className="text-xs opacity-70 ml-1">
                    {r.pct >= 0 ? "+" : ""}
                    {r.pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
