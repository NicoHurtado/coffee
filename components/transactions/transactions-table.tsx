"use client";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategoryIcon } from "@/lib/finance/categories";
import { signedAmount } from "@/lib/finance/format";
import { useAccountsStore } from "@/lib/store/accounts";
import { cn } from "@/lib/utils";
import type { Currency, Transaction } from "@/lib/types";
import { TransactionEditDialog } from "./transaction-edit-dialog";

const PAGE_SIZES = [10, 25, 50, 100];

export function TransactionsTable({
  txs,
  currency = "USD",
}: {
  txs: Transaction[];
  currency?: Currency;
}) {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const sorted = useMemo(
    () =>
      [...txs].sort(
        (a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt),
      ),
    [txs],
  );

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const end = Math.min(start + pageSize, total);
  const slice = sorted.slice(start, end);

  const accountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name ?? "—";

  if (total === 0) {
    return (
      <div className="text-sm text-muted-foreground py-12 text-center">
        Sin transacciones en este rango.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[140px]">Categoría</TableHead>
              <TableHead className="w-[160px]">Cuenta</TableHead>
              <TableHead className="w-[120px] text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((t) => {
              const Icon = getCategoryIcon(t.category);
              const isExpense = t.kind === "expense";
              const isIncome = t.kind === "income";
              const d = new Date(t.occurredAt);
              return (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => setEditing(t)}
                >
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {format(d, "d MMM yyyy", { locale: es })}
                    <div className="text-[10px] opacity-70">
                      {format(d, "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-[280px]">
                    {t.description || t.category}
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <Icon className="size-3.5 text-muted-foreground" />
                      {t.category}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {accountName(t.accountId)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm font-semibold tabular-nums",
                      isExpense && "text-red-500",
                      isIncome && "text-emerald-600",
                    )}
                  >
                    {signedAmount(t.kind, t.amount, currency)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Filas por página</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            {start + 1}–{end} de {total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <TransactionEditDialog
        tx={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
