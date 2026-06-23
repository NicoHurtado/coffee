"use client";
import { formatMoney } from "@/lib/finance/format";
import type { AccountType, CardNetwork, Currency } from "@/lib/types";
import { CardBrandLogo } from "./card-brand";

/**
 * Live preview shown while creating/editing an account. Mirrors the minimal
 * PhysicalCard exactly so what you see in the form is what lands on the list.
 */
export function AccountPreviewCard({
  type,
  name,
  institution,
  initialBalance,
  currency,
  last4,
  network,
  annualRate,
}: {
  type: AccountType;
  name?: string;
  institution?: string;
  initialBalance?: number;
  currency?: Currency;
  last4?: string;
  network?: string;
  annualRate?: number;
  color?: string;
}) {
  const isCard = type === "debit" || type === "credit";

  let secondaryLabel = "NUMBER";
  let secondaryValue = `•••• •••• ${last4 || "0000"}`;
  if (type === "fixed_income") {
    secondaryLabel = "TASA";
    secondaryValue = annualRate != null ? `${annualRate}%` : "—";
  } else if (type === "investment") {
    secondaryLabel = "ENTIDAD";
    secondaryValue = institution || "Entidad";
  }

  const balanceLabel = type === "credit" ? "DEUDA" : "BALANCE";

  return (
    <div className="relative w-full min-h-[160px] overflow-hidden rounded-xl border border-border/60 bg-card p-5 flex flex-col justify-between gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            NAME
          </div>
          <div className="text-sm font-medium truncate mt-1">{name || "Nombre"}</div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {secondaryLabel}
          </div>
          <div className="text-sm font-medium tabular-nums truncate mt-1">{secondaryValue}</div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {balanceLabel}
          </div>
          <div className="text-2xl font-semibold tabular-nums truncate mt-1">
            {formatMoney(initialBalance ?? 0, currency ?? "COP")}
          </div>
        </div>
        {isCard && (
          <CardBrandLogo
            network={network as CardNetwork | undefined}
            className="h-7 w-auto shrink-0 self-end"
          />
        )}
      </div>
    </div>
  );
}
