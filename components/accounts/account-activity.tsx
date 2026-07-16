"use client";
import { useMemo, useState } from "react";
import { Search, List, Table2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionEditDialog } from "@/components/transactions/transaction-edit-dialog";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useAccountsStore } from "@/lib/store/accounts";
import { useSettingsStore } from "@/lib/store/settings";
import { useCategoriesStore } from "@/lib/store/categories";
import { type Transaction } from "@/lib/types";
import { isSyncTx } from "@/lib/finance/sync";
import { cn } from "@/lib/utils";

import { Separator } from "@/components/ui/separator";

const PAGE_SIZE = 15;

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AccountActivity({ accountId }: { accountId: string }) {
  const txs = useTransactionsStore((s) => s.forAccount(accountId));
  const account = useAccountsStore((s) => s.getById(accountId));
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const categories = useCategoriesStore((s) => s.categories);

  const [view, setView] = useState<"list" | "table">("list");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState<string>(""); // yyyy-mm-dd or ""
  const [to, setTo] = useState<string>("");
  const [month, setMonth] = useState<string>("all"); // "all" | yyyy-mm
  const [category, setCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const resetPage = () => setVisibleCount(PAGE_SIZE);

  // Meses presentes en la actividad de la cuenta, del más reciente al más viejo.
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of txs) {
      const d = new Date(t.occurredAt);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [txs]);

  const monthLabel = (m: string) => {
    const [y, mm] = m.split("-");
    const d = new Date(Number(y), Number(mm) - 1, 1);
    const label = d.toLocaleDateString("es", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

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
        const d = new Date(t.occurredAt);
        const key = dayKey(d);
        if (month !== "all" && !key.startsWith(month)) return false;
        if (from && key < from) return false;
        if (to && key > to) return false;
        return true;
      })
      .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt));
  }, [txs, q, from, to, month, category]);

  const total = filtered.length;

  const pagedTxs = filtered.slice(0, visibleCount);

  // Group transactions by calendar day (yyyy-mm-dd key)
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; txs: typeof pagedTxs }>();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todayKey = dayKey(today);
    const yesterdayKey = dayKey(yesterday);

    for (const t of pagedTxs) {
      const d = new Date(t.occurredAt);
      const key = dayKey(d);
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
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{total} transacciones</span>
          <div className="flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="Vista de lista"
              className={cn(
                "px-2.5 py-1.5 flex items-center justify-center transition",
                view === "list" ? "bg-foreground text-background" : "hover:bg-accent",
              )}
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              aria-label="Vista de tabla"
              className={cn(
                "px-2.5 py-1.5 flex items-center justify-center transition",
                view === "table" ? "bg-foreground text-background" : "hover:bg-accent",
              )}
            >
              <Table2 className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              resetPage();
            }}
            placeholder="Buscar texto o categoría"
            className="pl-9"
          />
        </div>
        <Select
          value={month}
          onValueChange={(v) => {
            setMonth(v);
            resetPage();
          }}
        >
          <SelectTrigger className="md:w-[170px]">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los meses</SelectItem>
            {monthOptions.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            resetPage();
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

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="act-from" className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input
            id="act-from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              resetPage();
            }}
            className="w-[150px] h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="act-to" className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input
            id="act-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              resetPage();
            }}
            className="w-[150px] h-9"
          />
        </div>
        {(from || to || month !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground"
            onClick={() => {
              setFrom("");
              setTo("");
              setMonth("all");
              resetPage();
            }}
          >
            Limpiar fechas
          </Button>
        )}
      </div>

      {total === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Sin transacciones que coincidan.
        </div>
      ) : view === "table" ? (
        <TransactionsTable txs={filtered} currency={currency} />
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
                        accountType={account?.type}
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
