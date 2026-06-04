"use client";
import { formatMoney } from "@/lib/finance/format";
import { getColorDef, type AccountColor } from "@/lib/finance/colors";
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

  const accent = getColorDef(color).base;

  if (type === "debit" || type === "credit") {
    const isCredit = type === "credit";
    return (
      <div
        className="relative w-full min-h-[200px] overflow-hidden rounded-lg border bg-card p-4 md:p-5 flex flex-col justify-between gap-1.5"
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
              {TYPE_LABEL[type]}
            </div>
            <div className="text-sm font-semibold truncate mt-0.5">{institution || "Institución"}</div>
          </div>
          <ContactlessIcon className="size-5" style={{ color: accent, opacity: 0.9 }} />
        </div>

        <div className="relative flex items-end justify-between gap-3">
          <CardChip className="w-10 h-7 shrink-0 opacity-70" />
          <div className="text-right min-w-0">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              {isCredit ? "Deuda" : "Balance"}
            </div>
            <div className="text-xl md:text-2xl font-semibold tabular-nums truncate text-foreground">
              {formatMoney(initialBalance ?? 0, currency ?? "COP")}
            </div>
          </div>
        </div>

        <div className="relative font-mono tracking-[0.18em] text-sm md:text-base text-muted-foreground">
          •••• &nbsp; •••• &nbsp; •••• &nbsp; {last4 || "0000"}
        </div>

        <div className="relative flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              Titular
            </div>
            <div className="text-xs md:text-sm font-medium uppercase truncate tracking-wide">
              {userName || "Titular"}
            </div>
          </div>
          <span style={{ color: accent }} className="inline-flex">
            <CardBrandLogo network={network as CardNetwork | undefined} className="h-7 md:h-8 w-auto" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-lg p-5 min-h-40 border bg-card overflow-hidden"
      style={{ borderLeft: `2px solid ${accent}` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(420px 200px at 100% 0%, ${accent}1f, transparent 60%)`,
        }}
      />
      <div className="relative flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          <span className="size-1.5 rounded-full" style={{ background: accent }} />
          {TYPE_LABEL[type]}
        </span>
        {type === "fixed_income" && annualRate != null && (
          <span className="text-xs text-muted-foreground tabular-nums">{annualRate}% anual</span>
        )}
      </div>
      <div className="relative text-lg font-semibold mt-3 truncate">{name || "Nombre de la cuenta"}</div>
      <div className="relative text-xs text-muted-foreground truncate">{institution || "Institución"}</div>
      <div className="relative text-3xl font-semibold mt-3 tabular-nums">
        {formatMoney(initialBalance ?? 0, currency ?? "COP")}
      </div>
    </div>
  );
}
