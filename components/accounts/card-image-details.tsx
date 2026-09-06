import { formatMoney } from "@/lib/finance/format";
import type { Currency } from "@/lib/types";

/** Live account text, kept separate from the downloadable card artwork. */
export function CardImageDetails({ name, last4, balance, currency, credit }: {
  name: string; last4: string; balance: number; currency: Currency; credit: boolean;
}) {
  const negative = credit && balance > 0;
  return (
    <div
      className="absolute bottom-3 rounded-md px-2 py-1 text-white"
      style={{
        left: "4%",
        width: "65%",
        background: "rgba(0,0,0,0.72)",
      }}
    >
      <div className="flex items-center gap-2 text-[11px] leading-4">
        <span className="min-w-0 flex-1 truncate font-medium" title={name}>{name}</span>
        <span className="shrink-0 tabular-nums text-white/80">•• {last4}</span>
      </div>
      <div className="text-[8px] tracking-widest text-white/75">{credit ? "DEUDA" : "BALANCE"}</div>
      <div className="truncate text-lg font-semibold leading-5 tabular-nums" style={{ color: negative ? "#ffb4a8" : "white" }}>
        {negative ? "-" : ""}{formatMoney(balance, currency)}
      </div>
    </div>
  );
}
