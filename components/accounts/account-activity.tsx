"use client";
import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { TransactionEditDialog } from "@/components/transactions/transaction-edit-dialog";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useCategoriesStore } from "@/lib/store/categories";
import { type Transaction } from "@/lib/types";
import { isSyncTx } from "@/lib/finance/sync";

import { Separator } from "@/components/ui/separator";

const PAGE_SIZE = 15;

export function AccountActivity({ accountId }: { accountId: string }) {
  const txs = useTransactionsStore((s) => s.forAccount(accountId));
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const categories = useCategoriesStore((s) => s.categories);

  const [q, setQ] = useState("");
  const [day, setDay] = useState<string>(""); // yyyy-mm-dd or ""
  const [category, setCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const qLow = q.trim().toLowerCase();
    return txs
      .filter((t) => {
        if (isSyncTx(t)) return false;
        if (qLow) {
          const hay = `${t.description ?? ""} ${t.category}`.toLowerCase();
          if (!hay.includes(qLow)) return false;
        }
        if (category !== "all" && t.category !== category) return false;
        if (day) {
          const d = new Date(t.occurredAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (key !== day) return false;
        }
        return true;
      })
      .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt));
  }, [txs, q, day, category]);

  const total = filtered.length;
  
  const pagedTxs = filtered.slice(0, visibleCount);

  // Group transactions by calendar day (yyyy-mm-dd key)
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; txs: typeof pagedTxs }>();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const todayKey = fmt(today);
    const yesterdayKey = fmt(yesterday);

    for (const t of pagedTxs) {
      const d = new Date(t.occurredAt);
      const key = fmt(d);
      if (!map.has(key)) {
        let label: string;
        if (key === todayKey) {
          label = "Hoy";
        } else if (key === yesterdayKey) {
          label = "Ayer";
        } else {
          label = d.toLocaleDateString("es", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          // Capitalize first letter
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }
        map.set(key, { label, txs: [] });
      }
      map.get(key)!.txs.push(t);
    }
    return Array.from(map.values());
  }, [pagedTxs]);

  return (
    <div className="md:rounded-2xl md:border md:bg-card md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Actividad Reciente</h2>
        <span className="text-xs text-muted-foreground">{total} transacciones</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Buscar texto o categoría"
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={day}
          onChange={(e) => {
            setDay(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="md:w-[160px]"
        />
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <SelectTrigger className="md:w-[160px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.name} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Sin transacciones que coincidan.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
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

          {visibleCount < total && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="w-full sm:w-auto"
              >
                Ver más transacciones
              </Button>
            </div>
          )}
        </>
      )}

      <TransactionEditDialog
        tx={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
