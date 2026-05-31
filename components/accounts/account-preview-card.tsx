"use client";
import { formatMoney } from "@/lib/finance/format";
import { cardStyle, colorStyle, type AccountColor } from "@/lib/finance/colors";
import { useSettingsStore } from "@/lib/store/settings";
import type { AccountType, CardNetwork, Currency } from "@/lib/types";
import { CardBrandLogo, CardChip, ContactlessIcon } from "./card-brand";

const TYPE_LABEL: Record<AccountType, string> = {
  debit: "Débito",
  credit: "Crédito",
  fixed_income: "Renta Fija",
  investment: "Inversión",
};

export function AccountPreviewCard({
  type,
  name,
  institution,
  initialBalance,
  currency,
  last4,
  network,
  annualRate,
  color,
}: {
  type: AccountType;
  name?: string;
  institution?: string;
  initialBalance?: number;
  currency?: Currency;
  last4?: string;
  network?: string;
  annualRate?: number;
  color?: AccountColor;
}) {
  const userName = useSettingsStore((s) => s.userName);

  if (type === "debit" || type === "credit") {
    const cs = cardStyle(color);
    const isLight = cs.textTone === "light";
    return (
      <div
        className={`relative aspect-[1.586/1] w-full max-w-md mx-auto rounded-2xl overflow-hidden p-5 flex flex-col justify-between border ${
          isLight ? "text-white" : "text-zinc-900"
        }`}
        style={{ background: cs.background, borderColor: cs.border }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: isLight
              ? "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.08) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.05) 100%)",
          }}
        />
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={`text-[10px] uppercase tracking-wider ${isLight ? "opacity-70" : "opacity-60"}`}>
              {TYPE_LABEL[type]}
            </div>
            <div className="text-sm font-semibold truncate">{institution || "Institución"}</div>
          </div>
          <ContactlessIcon className="size-5" style={{ color: cs.brandColor, opacity: 0.9 }} />
        </div>
        <div className="relative flex items-end justify-between gap-3">
          <CardChip className="w-10 h-7 shrink-0" />
          <div className="text-right min-w-0">
            <div className={`text-[10px] uppercase tracking-wider ${isLight ? "opacity-70" : "opacity-60"}`}>Balance</div>
            <div className="text-xl font-bold tabular-nums truncate">
              {formatMoney(initialBalance ?? 0, currency ?? "COP")}
            </div>
          </div>
        </div>
        <div className="relative font-mono tracking-[0.18em] text-sm">
          •••• &nbsp; •••• &nbsp; •••• &nbsp; {last4 || "0000"}
        </div>
        <div className="relative flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className={`text-[9px] uppercase tracking-wider ${isLight ? "opacity-60" : "opacity-50"}`}>Titular</div>
            <div className="text-xs font-medium uppercase truncate tracking-wide">
              {userName || "Titular"}
            </div>
          </div>
          <span style={{ color: cs.brandColor }} className="inline-flex">
            <CardBrandLogo network={network as CardNetwork | undefined} className="h-7 w-auto" />
          </span>
        </div>
      </div>
    );
  }

  const s = colorStyle(color);
  return (
    <div className="rounded-2xl p-5 min-h-40 border bg-card">
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
          style={{ background: s.background, color: s.color }}
        >
          <span className="size-1.5 rounded-full" style={{ background: s.muted }} />
          {TYPE_LABEL[type]}
        </span>
        {type === "fixed_income" && annualRate != null && (
          <span className="text-xs text-muted-foreground tabular-nums">{annualRate}% anual</span>
        )}
      </div>
      <div className="text-lg font-semibold mt-3 truncate">{name || "Nombre de la cuenta"}</div>
      <div className="text-xs text-muted-foreground truncate">{institution || "Institución"}</div>
      <div className="text-3xl font-bold mt-3 tabular-nums">
        {formatMoney(initialBalance ?? 0, currency ?? "COP")}
      </div>
    </div>
  );
}
