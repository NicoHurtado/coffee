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
      className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-accent/40 rounded-md text-left"
    >
      <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {tx.description || tx.category}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {tx.category}
          {showTime ? ` · ${format(new Date(tx.occurredAt), "HH:mm")}` : ""}
        </div>
      </div>
      <div
        className={cn(
          "text-sm font-semibold tabular-nums",
          isExpense && "text-red-500",
          isIncome && "text-emerald-500",
          isTransfer && "text-blue-500",
        )}
      >
        {signedAmount(tx.kind, tx.amount, currency)}
      </div>
    </button>
  );
}
