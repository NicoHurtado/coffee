"use client";
import { formatMoney } from "@/lib/finance/format";
import { artTextColors, resolveCardArt } from "@/lib/finance/card-art";
import { getColorDef, type AccountColor } from "@/lib/finance/colors";
import type { Account, CardNetwork, Currency } from "@/lib/types";
import { CardBrandLogo } from "./card-brand";
import { CardFace } from "./card-face";
import { CardPhoto } from "./card-photo";
import { CardImageDetails } from "./card-image-details";
import { SavingsFace, savingsSubtitle } from "./savings-face";

export interface PhysicalCardProps {
  account: Account;
  balance: number;
  className?: string;
}

/**
 * Sober product card with the NAME / NUMBER / BALANCE labels. Debit and credit
 * accounts wear the art of the real plastic (issuer colors, wordmark, chip and
 * network mark) so they are recognisable at a glance; fixed income and
 * investments keep the quiet app surface. Layout and size are identical either
 * way so accounts, fixed income and investments still read as one family.
 */
export function PhysicalCard({ account, balance, className }: PhysicalCardProps) {
  const isCredit = account.type === "credit";
  const isDebit = account.type === "debit";
  const isCard = isCredit || isDebit;

  const last4 = isCredit ? account.last4 : isDebit ? (account.last4 ?? "0000") : "0000";
  const network = (isCard ? account.network : undefined) as CardNetwork | undefined;
  const art = resolveCardArt(account);
  const tone = art ? artTextColors(art.textTone) : undefined;

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

  const labelStyle = tone ? { color: tone.label } : undefined;
  const valueStyle = tone ? { color: tone.value } : undefined;

  // Renta fija e inversiones no son plástico: llevan el ícono del producto.
  if (account.type === "fixed_income" || account.type === "investment") {
    return (
      <SavingsFace
        type={account.type}
        name={account.name}
        subtitle={savingsSubtitle(
          account.type,
          account.name,
          account.institution,
          account.type === "fixed_income" ? account.annualRate : undefined,
        )}
        balance={balance}
        currency={account.currency as Currency}
        accent={getColorDef(account.color as AccountColor | undefined).base}
        className={className}
      />
    );
  }

  if (art?.imageUrl) {
    return (
      <div className={`w-full space-y-3 ${className ?? ""}`}>
        <CardImageDetails name={account.name} balance={balance} currency={account.currency} credit={isCredit} />
        <CardPhoto src={art.imageUrl} name={account.name} />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full min-h-[160px] overflow-hidden rounded-xl border p-5 flex flex-col justify-between gap-6 ${
        art ? "" : "border-border/60 bg-card"
      } ${className ?? ""}`}
      style={art ? { borderColor: art.border } : undefined}
    >
      {art && <CardFace art={art} />}

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className="text-[12px] tracking-[-0.005em] text-muted-foreground"
            style={labelStyle}
          >
            NAME
          </div>
          <div className="text-sm font-medium truncate mt-1" style={valueStyle}>
            {account.name}
          </div>
        </div>
        <div className="min-w-0 text-right">
          <div
            className="text-[12px] tracking-[-0.005em] text-muted-foreground"
            style={labelStyle}
          >
            {secondaryLabel}
          </div>
          <div
            className="text-sm font-medium tabular-nums truncate mt-1"
            style={valueStyle}
          >
            {secondaryValue}
          </div>
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div
            className="text-[12px] tracking-[-0.005em] text-muted-foreground"
            style={labelStyle}
          >
            {balanceLabel}
          </div>
          <div
            className={`text-2xl font-semibold tabular-nums truncate mt-1 ${
              tone ? "" : showNegative ? "text-destructive" : "text-foreground"
            }`}
            style={tone ? { color: showNegative ? tone.negative : tone.value } : undefined}
          >
            {showNegative ? "-" : ""}
            {formatMoney(balance, account.currency as Currency)}
          </div>
        </div>
        {isCard && (
          <span
            className="inline-flex shrink-0 self-end"
            style={art ? { color: art.brandColor } : undefined}
          >
            <CardBrandLogo network={network} className="h-7 w-auto" />
          </span>
        )}
      </div>
    </div>
  );
}
