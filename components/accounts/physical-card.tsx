"use client";
import { formatMoney } from "@/lib/finance/format";
import type { Account, CardNetwork, Currency } from "@/lib/types";
import { CardBrandLogo } from "./card-brand";

export interface PhysicalCardProps {
  account: Account;
  balance: number;
  className?: string;
}

/**
 * Minimal, sober product card. One quiet dark surface with NAME / NUMBER /
 * BALANCE labels and — for credit & debit — the network mark (Mastercard, etc.)
 * of the house the card belongs to. The same shape is reused for every product
 * type so accounts, fixed income and investments all read as one family.
 */
export function PhysicalCard({ account, balance, className }: PhysicalCardProps) {
  const isCredit = account.type === "credit";
  const isDebit = account.type === "debit";
  const isCard = isCredit || isDebit;

  const last4 = isCredit ? account.last4 : isDebit ? (account.last4 ?? "0000") : "0000";
  const network = (isCard ? account.network : undefined) as CardNetwork | undefined;

  // Right-hand secondary field changes per product, NUMBER for cards.
  let secondaryLabel = "NUMBER";
  let secondaryValue = `•••• •••• ${last4}`;
  if (account.type === "fixed_income") {
    secondaryLabel = "TASA";
    secondaryValue = `${account.annualRate.toFixed(2)}%`;
  } else if (account.type === "investment") {
    secondaryLabel = "ENTIDAD";
    secondaryValue = account.institution;
  }

  const balanceLabel = isCredit ? "DEUDA" : "BALANCE";
  const showNegative = isCredit && balance > 0;

  return (
    <div
      className={`relative w-full min-h-[160px] overflow-hidden rounded-xl border border-border/60 bg-card p-5 flex flex-col justify-between gap-6 ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            NAME
          </div>
          <div className="text-sm font-medium truncate mt-1">{account.name}</div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {secondaryLabel}
          </div>
          <div className="text-sm font-medium tabular-nums truncate mt-1">
            {secondaryValue}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {balanceLabel}
          </div>
          <div
            className={`text-2xl font-semibold tabular-nums truncate mt-1 ${
              showNegative ? "text-destructive" : "text-foreground"
            }`}
          >
            {showNegative ? "-" : ""}
            {formatMoney(balance, account.currency as Currency)}
          </div>
        </div>
        {isCard && (
          <CardBrandLogo network={network} className="h-7 w-auto shrink-0 self-end" />
        )}
      </div>
    </div>
  );
}
