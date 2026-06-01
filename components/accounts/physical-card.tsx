"use client";
import { cardStyle, type AccountColor } from "@/lib/finance/colors";
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
  const s = cardStyle(account.color as AccountColor | undefined);

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
  const isLight = s.textTone === "light";

  return (
    <div
      className={`relative w-full min-h-[200px] rounded-2xl p-4 md:p-5 flex flex-col justify-between gap-1.5 border ${
        isLight ? "text-white" : "text-zinc-900"
      } ${className ?? ""}`}
      style={{ background: s.background, borderColor: s.border }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          background: isLight
            ? "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.08) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.05) 100%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`text-[10px] uppercase tracking-wider ${isLight ? "opacity-70" : "opacity-60"}`}>
            {isCredit ? "Crédito" : "Débito"}
          </div>
          <div className="text-sm font-semibold truncate">{account.institution}</div>
        </div>
        <ContactlessIcon className="size-5" style={{ color: s.brandColor, opacity: 0.9 }} />
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <CardChip className="w-10 h-7 shrink-0" />
        <div className="text-right min-w-0">
          <div className={`text-[10px] uppercase tracking-wider ${isLight ? "opacity-70" : "opacity-60"}`}>
            {isCredit ? "Deuda" : "Balance"}
          </div>
          <div className="text-xl md:text-2xl font-bold tabular-nums truncate">
            {isCredit && balance > 0 ? "-" : ""}
            {formatMoney(balance, account.currency as Currency)}
          </div>
        </div>
      </div>

      <div className="relative font-mono tracking-[0.18em] text-sm md:text-base">
        •••• &nbsp; •••• &nbsp; •••• &nbsp; {last4}
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className={`text-[9px] uppercase tracking-wider ${isLight ? "opacity-60" : "opacity-50"}`}>
            Titular
          </div>
          <div className="text-xs md:text-sm font-medium uppercase truncate tracking-wide">
            {userName || "Titular"}
          </div>
          {isCredit && expDate && (
            <div className={`text-[10px] mt-0.5 ${isLight ? "opacity-70" : "opacity-60"}`}>
              VÁLIDA HASTA {expDate}
            </div>
          )}
        </div>
        <span style={{ color: s.brandColor }} className="inline-flex">
          <CardBrandLogo network={network} className="h-7 md:h-8 w-auto" />
        </span>
      </div>
    </div>
  );
}
