"use client";
import { useState } from "react";
import Link from "next/link";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { TransactionEditDialog } from "@/components/transactions/transaction-edit-dialog";
import type { Transaction } from "@/lib/types";
import { isSyncTx } from "@/lib/finance/sync";
import { collapseTransferPairs } from "@/lib/finance/transfers";

import { Separator } from "@/components/ui/separator";

export function RecentActivity({
  accountId,
  limit = 8,
  hrefAll = "/historial",
}: {
  accountId?: string;
  limit?: number;
  hrefAll?: string;
}) {
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const txs = useTransactionsStore((s) => s.transactions);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const sorted = (accountId ? txs.filter((t) => t.accountId === accountId) : txs)
    .filter((t) => !isSyncTx(t))
    .slice()
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt));
  // En la vista global, un traslado son dos patas: mostrar solo una fila.
  const filtered = (accountId ? sorted : collapseTransferPairs(sorted)).slice(0, limit);

  // Group transactions by calendar day (yyyy-mm-dd key)
  const grouped = filtered.reduce((acc, t) => {
    const d = new Date(t.occurredAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    
    if (!acc.has(key)) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const fmt = (date: Date) => 
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        
      let label: string;
      if (key === fmt(today)) {
        label = "Hoy";
      } else if (key === fmt(yesterday)) {
        label = "Ayer";
      } else {
        label = d.toLocaleDateString("es", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }
      
      acc.set(key, { label, txs: [] });
    }
    
    acc.get(key)!.txs.push(t);
    return acc;
  }, new Map<string, { label: string; txs: typeof filtered }>());
  
  const groupedArray = Array.from(grouped.values());

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Actividad Reciente</h2>
        <Link href={hrefAll} className="text-sm text-muted-foreground hover:underline">
          Ver todo
        </Link>
      </div>
      {groupedArray.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          Aún no hay transacciones.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedArray.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="px-1 text-sm font-medium text-muted-foreground">
                {group.label}
              </div>
              <div className="flex flex-col">
                {group.txs.map((t, idx) => (
                  <div key={t.id}>
                    <TransactionItem
                      tx={t}
                      currency={currency}
                      showTime
                      onClick={() => setEditing(t)}
                    />
                    {idx < group.txs.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <TransactionEditDialog
        tx={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </section>
  );
}
