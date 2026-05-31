"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, startOfWeek, addDays, subYears, addWeeks, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { formatMoney } from "@/lib/finance/format";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const RANGES = [
  { key: "6m", months: 6, label: "6 meses" },
  { key: "1y", months: 12, label: "1 año" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function SpendingHeatmap() {
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const [range, setRange] = useState<RangeKey>("1y");
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(12);
  const [colWidth, setColWidth] = useState(12);

  const { weeks, max, totalSpent, daysWithSpending } = useMemo(() => {
    const today = startOfDay(new Date());
    const months = RANGES.find((r) => r.key === range)?.months ?? 12;
    const startDate = subYears(today, months / 12);
    const start = startOfWeek(startDate, { weekStartsOn: 1 });

    const byDay = new Map<string, number>();
    txs
      .filter((t) => t.kind === "expense")
      .forEach((t) => {
        const d = startOfDay(new Date(t.occurredAt));
        if (d < start || d > today) return;
        const k = dayKey(d);
        byDay.set(k, (byDay.get(k) ?? 0) + t.amount);
      });

    const totalSpent = [...byDay.values()].reduce((s, v) => s + v, 0);
    const daysWithSpending = byDay.size;
    const max = Math.max(0, ...byDay.values());

    const weeks: { date: Date; amount: number }[][] = [];
    let cursor = start;
    while (cursor <= today) {
      const week: { date: Date; amount: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(cursor, i);
        week.push({ date: d, amount: d > today ? -1 : (byDay.get(dayKey(d)) ?? 0) });
      }
      weeks.push(week);
      cursor = addWeeks(cursor, 1);
    }
    return { weeks, max, totalSpent, daysWithSpending };
  }, [txs, range]);

  // Recompute cell size when container width or weeks count changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const available = el.clientWidth - 26; // 24 day-label + 2 gap
      const gap = 2;
      const uncapped = (available - gap * (weeks.length - 1)) / weeks.length;
      setCellSize(Math.min(16, Math.max(9, uncapped)));
      setColWidth(Math.max(9, uncapped));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [weeks.length]);

  const shade = (amount: number) => {
    if (amount < 0) return "bg-transparent";
    if (amount === 0) return "bg-muted/40";
    if (max === 0) return "bg-muted/40";
    const ratio = amount / max;
    if (ratio < 0.2) return "bg-zinc-300 dark:bg-zinc-700";
    if (ratio < 0.4) return "bg-zinc-500 dark:bg-zinc-500";
    if (ratio < 0.7) return "bg-zinc-700 dark:bg-zinc-300";
    return "bg-zinc-900 dark:bg-zinc-100";
  };

  // Month labels — only show if at least 3 weeks apart from previous
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    let lastCol = -999;
    weeks.forEach((week, i) => {
      const firstDay = week[0].date;
      const month = firstDay.getMonth();
      if (month !== lastMonth && i - lastCol >= 3) {
        labels.push({ col: i, label: format(firstDay, "MMM", { locale: es }) });
        lastMonth = month;
        lastCol = i;
      }
    });
    return labels;
  }, [weeks]);

  const avgDaily = daysWithSpending > 0 ? totalSpent / daysWithSpending : 0;
  const gap = 2;

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Calendario de gastos
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {daysWithSpending} días con gasto · prom. diario{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatMoney(avgDaily, currency)}
            </span>
          </div>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition",
                range === r.key ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <TooltipProvider delayDuration={50}>
        <div ref={containerRef} className="w-full">
          {/* Month labels */}
          <div className="relative mb-1" style={{ marginLeft: 28 }}>
            {monthLabels.map((m) => (
              <span
                key={`${m.col}-${m.label}`}
                className="absolute text-[10px] text-muted-foreground uppercase"
                style={{ left: m.col * (colWidth + gap) }}
              >
                {m.label}
              </span>
            ))}
            <div style={{ height: 14 }} />
          </div>

          <div className="flex" style={{ gap }}>
            {/* Day labels */}
            <div
              className="flex flex-col shrink-0 text-[9px] text-muted-foreground"
              style={{ gap, width: 24 }}
            >
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-end pr-1"
                  style={{ height: cellSize }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex flex-1" style={{ gap }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col flex-1" style={{ gap }}>
                  {week.map((day, di) => (
                    <Tooltip key={di}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn("rounded-[2px]", shade(day.amount))}
                          style={{ height: cellSize }}
                        />
                      </TooltipTrigger>
                      {day.amount >= 0 && (
                        <TooltipContent side="top" className="px-2.5 py-1.5">
                          <div className="text-xs font-medium">
                            {format(day.date, "d MMM yyyy", { locale: es })}
                          </div>
                          <div className="text-xs tabular-nums">
                            {day.amount > 0 ? (
                              <span className="text-red-500">
                                -{formatMoney(day.amount, currency)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Sin gasto</span>
                            )}
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Scale legend */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Menos</span>
        <div className="size-3 rounded-[2px] bg-muted/40" />
        <div className="size-3 rounded-[2px] bg-zinc-300 dark:bg-zinc-700" />
        <div className="size-3 rounded-[2px] bg-zinc-500 dark:bg-zinc-500" />
        <div className="size-3 rounded-[2px] bg-zinc-700 dark:bg-zinc-300" />
        <div className="size-3 rounded-[2px] bg-zinc-900 dark:bg-zinc-100" />
        <span>Más</span>
      </div>
    </div>
  );
}
