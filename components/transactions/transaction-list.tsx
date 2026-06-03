"use client";
import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { TransactionItem } from "./transaction-item";
import { TransactionEditDialog } from "./transaction-edit-dialog";
import { formatMoney } from "@/lib/finance/format";
import type { Currency, Transaction } from "@/lib/types";

function dayLabel(d: Date): string {
  if (isToday(d)) return "HOY";
  if (isYesterday(d)) return "AYER";
  return format(d, "d 'de' MMMM", { locale: es });
}

function dayKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function TransactionList({
  txs,
  currency = "USD",
}: {
  txs: Transaction[];
  currency?: Currency;
}) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const sorted = [...txs].sort(
    (a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt),
  );
  const groups = new Map<string, Transaction[]>();
  for (const t of sorted) {
    const k = dayKey(new Date(t.occurredAt));
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-10 text-center">
        Sin transacciones en este rango.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([key, items]) => {
        const date = new Date(items[0].occurredAt);
        const net = items.reduce(
          (s, t) => s + (t.kind === "income" ? t.amount : t.kind === "expense" ? -t.amount : 0),
          0,
        );
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em] tabular-nums">
              <span>{dayLabel(date)}</span>
              <span className={net >= 0 ? "text-primary" : "text-destructive"}>
                {net >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(net), currency)}
              </span>
            </div>
            <div className="divide-y rounded-lg border bg-card overflow-hidden px-2">
              {items.map((t) => (
                <TransactionItem
                  key={t.id}
                  tx={t}
                  currency={currency}
                  showTime
                  onClick={() => setEditing(t)}
                />
              ))}
            </div>
          </div>
        );
      })}
      <TransactionEditDialog
        tx={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
