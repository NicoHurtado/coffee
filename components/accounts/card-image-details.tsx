import { formatMoney } from "@/lib/finance/format";
import type { Currency } from "@/lib/types";

/** Account information lives above the photograph, never on top of it. */
export function CardImageDetails({ name, balance, currency, credit }: {
  name: string; balance: number; currency: Currency; credit: boolean;
}) {
  const negative = credit && balance > 0;
  return (
    <div className="space-y-1 text-foreground">
      <div className="break-words text-sm font-semibold leading-5">{name}</div>
      <div className="truncate text-xs text-muted-foreground">
        {credit ? "Crédito · Deuda actual" : "Débito · Saldo"}
      </div>
      <div className={`break-words text-xl font-semibold tabular-nums ${negative ? "text-destructive" : "text-foreground"}`}>
        {negative ? "-" : ""}{formatMoney(balance, currency)}
      </div>
    </div>
  );
}
