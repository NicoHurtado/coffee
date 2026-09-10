"use client";
import { formatAccountBalance } from "@/lib/finance/format";
import { artTextColors, resolveCardArtFrom } from "@/lib/finance/card-art";
import { getColorDef, type AccountColor } from "@/lib/finance/colors";
import type { AccountType, CardNetwork, Currency } from "@/lib/types";
import { CardBrandLogo } from "./card-brand";
import { CardFace } from "./card-face";
import { CardPhoto } from "./card-photo";
import { CardImageDetails } from "./card-image-details";
import { SavingsFace, savingsSubtitle } from "./savings-face";

/**
 * Live preview shown while creating/editing an account. Mirrors the
 * PhysicalCard exactly — real card art included — so what you see in the form
 * is what lands on the list.
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
  color,
  presetId,
  artImageUrl,
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
  presetId?: string;
  artImageUrl?: string;
}) {
  const isCard = type === "debit" || type === "credit";
  const art = isCard
    ? resolveCardArtFrom({
        presetId,
        institution,
        name,
        type,
        network: network as CardNetwork | undefined,
        imageUrl: artImageUrl,
      })
    : undefined;
  const tone = art ? artTextColors(art.textTone) : undefined;
  const labelStyle = tone ? { color: tone.label } : undefined;
  const valueStyle = tone ? { color: tone.value } : undefined;

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

  // Misma ficha que en la lista para renta fija e inversiones.
  if (type === "fixed_income" || type === "investment") {
    return (
      <SavingsFace
        type={type}
        name={name || "Nombre"}
        subtitle={savingsSubtitle(type, name || "Nombre", institution || "", annualRate)}
        balance={initialBalance ?? 0}
        currency={currency ?? "COP"}
        accent={getColorDef(color as AccountColor | undefined).base}
      />
    );
  }

  if (art?.imageUrl) {
    return (
      <div className="w-full max-w-[22rem] space-y-3">
        <CardImageDetails name={name || "Nombre"} balance={initialBalance ?? 0} currency={currency ?? "COP"} credit={type === "credit"} />
        <CardPhoto src={art.imageUrl} name={name || "Nombre"} />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full min-h-[160px] overflow-hidden rounded-xl border p-5 flex flex-col justify-between gap-6 ${
        art ? "" : "border-border/60 bg-card"
      }`}
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
            {name || "Nombre"}
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
            className="text-2xl font-semibold tabular-nums truncate mt-1"
            style={valueStyle}
          >
            {formatAccountBalance(type, initialBalance ?? 0, currency ?? "COP")}
          </div>
        </div>
        {isCard && (
          <span
            className="inline-flex shrink-0 self-end"
            style={art ? { color: art.brandColor } : undefined}
          >
            <CardBrandLogo
              network={network as CardNetwork | undefined}
              className="h-7 w-auto"
            />
          </span>
        )}
      </div>
    </div>
  );
}
