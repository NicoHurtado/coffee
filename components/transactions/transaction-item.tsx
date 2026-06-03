"use client";
import { format } from "date-fns";
import { getCategoryIcon } from "@/lib/finance/categories";
import { signedAmount } from "@/lib/finance/format";
import type { Transaction, Currency } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TransactionItem({
  tx,
  currency = "USD",
  showTime = false,
  onClick,
}: {
  tx: Transaction;
  currency?: Currency;
  showTime?: boolean;
  onClick?: () => void;
}) {
  const Icon = getCategoryIcon(tx.category);
  const isExpense = tx.kind === "expense";
  const isIncome = tx.kind === "income";
  const isTransfer = tx.kind === "transfer";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 px-1.5 hover:bg-accent/40 rounded-md text-left"
    >
      <div className="size-9 rounded-md border bg-muted flex items-center justify-center shrink-0">
        <Icon className="size-4.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {tx.description || tx.category}
        </div>
        <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground truncate tabular-nums">
          {tx.category}
          {showTime ? ` · ${format(new Date(tx.occurredAt), "HH:mm")}` : ""}
        </div>
      </div>
      <div
        className={cn(
          "text-sm font-semibold tabular-nums",
          isExpense && "text-destructive",
          isIncome && "text-primary",
          isTransfer && "text-blue-500",
        )}
      >
        {signedAmount(tx.kind, tx.amount, currency)}
      </div>
    </button>
  );
}
