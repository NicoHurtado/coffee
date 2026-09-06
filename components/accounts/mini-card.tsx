"use client";
import { getColorDef, type AccountColor } from "@/lib/finance/colors";
import { resolveCardArt } from "@/lib/finance/card-art";
import { CardBrandLogo } from "./card-brand";
import { CardFace } from "./card-face";
import type { Account, CardNetwork } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Small account identifier. Debit and credit accounts show a thumbnail of the
 * real card art — same design as the big card, cropped to the tile — so a card
 * is recognisable straight from the list. Fixed income and investments keep the
 * dark tile with the accent monogram.
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
    const art = resolveCardArt(account);
    return (
      <div
        className={cn(
          "relative h-9 w-12 shrink-0 overflow-hidden rounded-md flex items-end justify-end p-1",
          art?.imageUrl ? "" : "border",
          art ? "" : "bg-muted",
          className,
        )}
        style={art ? { borderColor: art.border } : { borderLeft: `2px solid ${accent}` }}
      >
        {art ? (
          <CardFace art={art} detail="mini" />
        ) : (
          <div
            className="absolute left-1.5 top-1.5 h-1.5 w-2 rounded-[1px]"
            style={{ background: accent }}
          />
        )}
        {!art?.imageUrl && <span style={{ color: art ? art.brandColor : accent }} className="relative inline-flex">
          <CardBrandLogo network={network} className="h-2.5 w-auto" />
        </span>}
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
