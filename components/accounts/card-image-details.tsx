import { formatMoney } from "@/lib/finance/format";
import type { Currency } from "@/lib/types";

/** Account information lives above the photograph, never on top of it. */
export function CardImageDetails({ name, last4, balance, currency, credit }: {
  name: string; last4: string; balance: number; currency: Currency; credit: boolean;
}) {
  const negative = credit && balance > 0;
  return (
    <div className="space-y-1 text-foreground">
      <div className="break-words text-sm font-semibold leading-5">{name}</div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{credit ? "Crédito" : "Débito"} · •• {last4}</span>
        <span>{credit ? "Deuda actual" : "Saldo disponible"}</span>
      </div>
      <div className={`break-words text-xl font-semibold tabular-nums ${negative ? "text-destructive" : "text-foreground"}`}>
        {negative ? "-" : ""}{formatMoney(balance, currency)}
      </div>
    </div>
  );
}
