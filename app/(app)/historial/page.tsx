"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AccountPills } from "@/components/transactions/account-pills";
import {
  PeriodPicker,
  defaultPeriod,
  type PeriodRange,
} from "@/components/transactions/period-picker";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { AddTransactionButton } from "@/components/nav/add-transaction-button";
import { LayoutList, Table as TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { formatMoney } from "@/lib/finance/format";

export default function HistorialPage() {
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const [q, setQ] = useState("");
  const [accountId, setAccountId] = useState<string | "all">("all");
  const [period, setPeriod] = useState<PeriodRange>(defaultPeriod());
  const [view, setView] = useState<"list" | "table">("list");

  const filtered = useMemo(() => {
    const qLow = q.trim().toLowerCase();
    return txs.filter((t) => {
      const d = new Date(t.occurredAt);
      if (d < period.from || d > period.to) return false;
      if (accountId !== "all" && t.accountId !== accountId) return false;
      if (qLow) {
        const hay = `${t.description ?? ""} ${t.category}`.toLowerCase();
        if (!hay.includes(qLow)) return false;
      }
      return true;
    });
  }, [txs, q, accountId, period]);

  const totals = useMemo(() => {
    const income = filtered.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Historial</h1>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition",
                view === "list" ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              <LayoutList className="size-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition",
                view === "table" ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              <TableIcon className="size-3.5" />
              Tabla
            </button>
          </div>
          <AddTransactionButton />
        </div>
      </div>

      {/* MOBILE filters bar */}
      <div className="md:hidden sticky top-0 z-10 bg-background pt-2 pb-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="pl-9" />
        </div>
        <AccountPills value={accountId} onChange={setAccountId} />
        <div className="flex justify-end">
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* MOBILE list */}
      <div className="md:hidden">
        <TransactionList txs={filtered} currency={currency} />
      </div>

      {/* DESKTOP layout */}
      <div className="hidden md:grid md:grid-cols-12 gap-6">
        <aside className="col-span-3 space-y-4">
          <div className="rounded-2xl border bg-card p-4 space-y-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Buscar</div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Texto o categoría" className="pl-9" />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Período</div>
              <PeriodPicker value={period} onChange={setPeriod} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Cuenta</div>
              <AccountPills value={accountId} onChange={setAccountId} variant="wrap" />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Resumen del filtro</div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ingresos</span>
              <span className="font-semibold text-emerald-600 tabular-nums">
                +{formatMoney(totals.income, currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gastos</span>
              <span className="font-semibold text-red-500 tabular-nums">
                -{formatMoney(totals.expense, currency)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm">
              <span>Neto</span>
              <span
                className={`font-bold tabular-nums ${totals.net >= 0 ? "text-emerald-600" : "text-red-500"}`}
              >
                {totals.net >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(totals.net), currency)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground pt-1">
              {filtered.length} {filtered.length === 1 ? "transacción" : "transacciones"}
            </div>
          </div>
        </aside>

        <div className="col-span-9 rounded-2xl border bg-card p-4">
          {view === "table" ? (
            <TransactionsTable txs={filtered} currency={currency} />
          ) : (
            <TransactionList txs={filtered} currency={currency} />
          )}
        </div>
      </div>
    </div>
  );
}
