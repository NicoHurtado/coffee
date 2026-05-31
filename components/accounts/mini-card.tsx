"use client";
import { cardStyle, type AccountColor } from "@/lib/finance/colors";
import { CardBrandLogo } from "./card-brand";
import type { Account, CardNetwork } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Small visual identifier for an account — mimics the look of its card/badge. */
export function MiniCard({
  account,
  className,
}: {
  account: Account;
  className?: string;
}) {
  const color = account.color as AccountColor | undefined;

  if (account.type === "debit" || account.type === "credit") {
    const s = cardStyle(color);
    const isLight = s.textTone === "light";
    const network = (account.type === "credit"
      ? account.network
      : account.network) as CardNetwork | undefined;
    return (
      <div
        className={cn(
          "relative w-12 h-8 rounded-md overflow-hidden border shrink-0 flex items-end justify-end p-1",
          className,
        )}
        style={{ background: s.background, borderColor: s.border }}
      >
        {/* chip dot */}
        <div className="absolute top-1 left-1 size-1.5 rounded-[1px] bg-amber-300/80" />
        <span
          style={{ color: s.brandColor }}
          className={cn("inline-flex", isLight ? "opacity-95" : "opacity-90")}
        >
          <CardBrandLogo network={network} className="h-2 w-auto" />
        </span>
      </div>
    );
  }

  // renta fija / inversión: small tile with full saturated card gradient
  const s = cardStyle(color);
  const isLight = s.textTone === "light";
  const fallback =
    account.type === "fixed_income" ? "RF" : account.type === "investment" ? "IN" : "·";
  const label = (account.miniLabel ?? fallback).slice(0, 5).toUpperCase();
  return (
    <div
      className={cn(
        "w-12 h-8 rounded-md border shrink-0 flex items-center justify-center font-bold tracking-wider px-0.5",
        label.length <= 2 ? "text-[10px]" : label.length <= 3 ? "text-[9px]" : "text-[8px]",
        isLight ? "text-white" : "text-zinc-900",
        className,
      )}
      style={{ background: s.background, borderColor: s.border }}
    >
      {label}
    </div>
  );
}
