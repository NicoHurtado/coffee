"use client";
import { useMemo } from "react";
import { Repeat } from "lucide-react";
import { subMonths } from "date-fns";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { formatMoney } from "@/lib/finance/format";
import { getCategoryIcon } from "@/lib/finance/categories";
import type { Category } from "@/lib/types";

interface RecurringItem {
  key: string;
  label: string;
  category: Category;
  amount: number; // most recent
  count: number;
  monthlyEquivalent: number;
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function RecurringSubscriptions() {
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);

  const items = useMemo<RecurringItem[]>(() => {
    const cutoff = subMonths(new Date(), 6);
    const groups = new Map<
      string,
      {
        label: string;
        category: Category;
        amounts: { amount: number; date: Date }[];
      }
    >();

    txs
      .filter((t) => t.kind === "expense" && new Date(t.occurredAt) >= cutoff)
      .forEach((t) => {
        const key = t.description ? normalize(t.description) : "";
        if (!key) return;
        const g = groups.get(key) ?? {
          label: t.description!,
          category: t.category,
          amounts: [],
        };
        g.amounts.push({ amount: t.amount, date: new Date(t.occurredAt) });
        groups.set(key, g);
      });

    const out: RecurringItem[] = [];
    for (const [key, g] of groups) {
      if (g.amounts.length < 3) continue;
      // Check amounts are similar (coefficient of variation < 0.25)
      const sum = g.amounts.reduce((s, a) => s + a.amount, 0);
      const mean = sum / g.amounts.length;
      const variance =
        g.amounts.reduce((s, a) => s + (a.amount - mean) ** 2, 0) /
        g.amounts.length;
      const std = Math.sqrt(variance);
      const cv = mean > 0 ? std / mean : 0;
      if (cv > 0.25) continue;

      // Sort by date desc to get latest amount
      const sorted = [...g.amounts].sort(
        (a, b) => +b.date - +a.date,
      );
      const latest = sorted[0].amount;

      // Estimate monthly equivalent: total in window / months in window (6)
      const monthlyEquivalent = sum / 6;

      out.push({
        key,
        label: g.label,
        category: g.category,
        amount: latest,
        count: g.amounts.length,
        monthlyEquivalent,
      });
    }

    return out.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
  }, [txs]);

  const total = items.reduce((s, i) => s + i.monthlyEquivalent, 0);

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Repeat className="size-3" /> Suscripciones detectadas
          </div>
          <div className="text-2xl font-bold tabular-nums mt-1">
            {formatMoney(total, currency)}
            <span className="text-xs font-normal text-muted-foreground ml-2">
              /mes estimado
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {items.length} recurrentes · últimos 6 meses
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          No se detectaron gastos recurrentes claros.
        </div>
      ) : (
        <div className="divide-y max-h-72 overflow-y-auto">
          {items.map((it) => {
            const Icon = getCategoryIcon(it.category);
            return (
              <div
                key={it.key}
                className="flex items-center gap-3 py-2.5"
              >
                <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {it.category} · {it.count}x detectado
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums">
                    {formatMoney(it.amount, currency)}
                  </div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    ≈ {formatMoney(it.monthlyEquivalent, currency)}/mes
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
