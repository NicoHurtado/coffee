"use client";
import { getColorDef, type AccountColor } from "@/lib/finance/colors";
import { formatMoney } from "@/lib/finance/format";
import { useSettingsStore } from "@/lib/store/settings";
import type { Account, CardNetwork, Currency } from "@/lib/types";
import { CardBrandLogo, CardChip, ContactlessIcon } from "./card-brand";

export interface PhysicalCardProps {
  account: Account;
  balance: number;
  className?: string;
}

export function PhysicalCard({ account, balance, className }: PhysicalCardProps) {
  const userName = useSettingsStore((s) => s.userName);
  const accent = getColorDef(account.color as AccountColor | undefined).base;

  const isCredit = account.type === "credit";
  const isDebit = account.type === "debit";
  const last4 =
    isCredit ? account.last4 : isDebit ? (account.last4 ?? "0000") : "0000";
  const network = (isCredit
    ? account.network
    : isDebit
      ? account.network
      : undefined) as CardNetwork | undefined;
  const expDate = isCredit ? account.expDate : "";

  return (
    <div
      className={`relative w-full min-h-[200px] overflow-hidden rounded-lg border bg-card p-4 md:p-5 flex flex-col justify-between gap-1.5 ${className ?? ""}`}
      style={{ borderLeft: `2px solid ${accent}` }}
    >
      {/* faint accent glow tied to the account color — identity without the gloss */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(420px 200px at 100% 0%, ${accent}1f, transparent 60%)`,
        }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            <span className="size-1.5 rounded-full" style={{ background: accent }} />
            {isCredit ? "Crédito" : "Débito"}
          </div>
          <div className="text-sm font-semibold truncate mt-0.5">{account.institution}</div>
        </div>
        <ContactlessIcon className="size-5" style={{ color: accent, opacity: 0.9 }} />
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <CardChip className="w-10 h-7 shrink-0 opacity-70" />
        <div className="text-right min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            {isCredit ? "Deuda" : "Balance"}
          </div>
          <div
            className={`text-xl md:text-2xl font-semibold tabular-nums truncate ${
              isCredit && balance > 0 ? "text-destructive" : "text-foreground"
            }`}
          >
            {isCredit && balance > 0 ? "-" : ""}
            {formatMoney(balance, account.currency as Currency)}
          </div>
        </div>
      </div>

      <div className="relative font-mono tracking-[0.18em] text-sm md:text-base text-muted-foreground">
        •••• &nbsp; •••• &nbsp; •••• &nbsp; {last4}
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
            Titular
          </div>
          <div className="text-xs md:text-sm font-medium uppercase truncate tracking-wide">
            {userName || "Titular"}
          </div>
          {isCredit && expDate && (
            <div className="text-[10px] mt-0.5 text-muted-foreground tabular-nums">
              VÁLIDA HASTA {expDate}
            </div>
          )}
        </div>
        <span style={{ color: accent }} className="inline-flex">
          <CardBrandLogo network={network} className="h-7 md:h-8 w-auto" />
        </span>
      </div>
    </div>
  );
}
