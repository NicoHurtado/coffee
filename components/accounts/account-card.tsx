"use client";
import Link from "next/link";
import { formatMoney } from "@/lib/finance/format";
import { utilizationPct } from "@/lib/finance/credit";
import { computeAccountBalance, toBaseCurrency } from "@/lib/finance/net-worth";
import { daysToMaturity } from "@/lib/finance/fixed-income";
import { colorStyle, type AccountColor } from "@/lib/finance/colors";
import type { Account } from "@/lib/types";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { PhysicalCard } from "./physical-card";

const TYPE_LABEL: Record<Account["type"], string> = {
  debit: "Débito",
  credit: "Crédito",
  fixed_income: "Renta Fija",
  investment: "Inversión",
};

export function AccountCard({ account }: { account: Account }) {
  const txs = useTransactionsStore((s) => s.forAccount(account.id));
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const balance = computeAccountBalance(account, txs);
  const showCop = account.currency === "USD" && !!usdToCop;

  // For credit / debit: physical card visual
  if (account.type === "credit" || account.type === "debit") {
    return (
      <Link
        href={`/cuentas/${account.id}`}
        className="flex flex-col h-full min-w-64 max-w-[20rem] w-full shrink-0 transition-transform hover:-translate-y-0.5"
      >
        <PhysicalCard account={account} balance={balance} className="flex-1" />
        {account.type === "credit" && (
          <div className="mt-2 text-xs text-muted-foreground flex justify-between">
            <span>{account.name}</span>
            <span>{utilizationPct(account, txs).toFixed(0)}% usado</span>
          </div>
        )}
        {account.type === "debit" && (
          <div className="mt-2 text-xs text-muted-foreground truncate">{account.name}</div>
        )}
      </Link>
    );
  }

  // Fixed income / investment: neutral card mirroring physical card proportions
  const s = colorStyle(account.color as AccountColor | undefined);
  return (
    <Link
      href={`/cuentas/${account.id}`}
      className="flex flex-col h-full min-w-64 max-w-[20rem] w-full shrink-0 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex-1 w-full min-h-[200px] rounded-2xl border bg-card p-4 md:p-5 flex flex-col justify-between gap-1.5 hover:bg-accent/40 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
            style={{ background: s.background, color: s.color }}
          >
            <span className="size-1.5 rounded-full" style={{ background: s.muted }} />
            {TYPE_LABEL[account.type]}
          </span>
          {account.type === "fixed_income" && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {account.annualRate.toFixed(2)}% anual
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {account.institution}
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Balance
            </div>
            <div className="text-xl md:text-2xl font-bold tabular-nums">
              {showCop
                ? formatMoney(toBaseCurrency(balance, account.currency, usdToCop), "COP")
                : formatMoney(balance, account.currency)}
            </div>
            {showCop && (
              <div className="text-[11px] text-muted-foreground tabular-nums">
                {formatMoney(balance, "USD")}
              </div>
            )}
          </div>
          {account.type === "fixed_income" && account.maturityDate && (
            <div className="text-[10px] text-muted-foreground text-right">
              {daysToMaturity(account)} días<br />restantes
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground truncate">{account.name}</div>
    </Link>
  );
}
