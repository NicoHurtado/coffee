"use client";
import { getColorDef, type AccountColor } from "@/lib/finance/colors";
import { CardBrandLogo } from "./card-brand";
import type { Account, CardNetwork } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Small high-contrast account identifier. Dark tile that matches the app
 * surface, with the account's color shown only as a left accent bar + tinted
 * mark — consistent with the redesigned physical cards.
 */
export function MiniCard({
  account,
  className,
}: {
  account: Account;
  className?: string;
}) {
  const accent = getColorDef(account.color as AccountColor | undefined).base;

  if (account.type === "debit" || account.type === "credit") {
    const network = account.network as CardNetwork | undefined;
    return (
      <div
        className={cn(
          "relative h-9 w-12 shrink-0 overflow-hidden rounded-md border bg-muted flex items-end justify-end p-1",
          className,
        )}
        style={{ borderLeft: `2px solid ${accent}` }}
      >
        <div className="absolute left-1.5 top-1.5 h-1.5 w-2 rounded-[1px]" style={{ background: accent }} />
        <span style={{ color: accent }} className="inline-flex">
          <CardBrandLogo network={network} className="h-2.5 w-auto" />
        </span>
      </div>
    );
  }

  // renta fija / inversión: dark tile with accent monogram
  const fallback =
    account.type === "fixed_income" ? "RF" : account.type === "investment" ? "IN" : "·";
  const label = (account.miniLabel ?? fallback).slice(0, 5).toUpperCase();
  return (
    <div
      className={cn(
        "flex h-9 w-12 shrink-0 items-center justify-center rounded-md border bg-muted px-0.5 font-mono font-semibold tracking-wider",
        label.length <= 2 ? "text-[10px]" : label.length <= 3 ? "text-[9px]" : "text-[8px]",
        className,
      )}
      style={{ borderLeft: `2px solid ${accent}`, color: accent }}
    >
      {label}
    </div>
  );
}
