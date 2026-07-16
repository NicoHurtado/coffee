"use client";
import Link from "next/link";
import { utilizationPct } from "@/lib/finance/credit";
import { computeAccountBalance } from "@/lib/finance/net-worth";
import { daysToMaturity } from "@/lib/finance/fixed-income";
import type { Account } from "@/lib/types";
import { useTransactionsStore } from "@/lib/store/transactions";
import { PhysicalCard } from "./physical-card";

export function AccountCard({ account }: { account: Account }) {
  const txs = useTransactionsStore((s) => s.forAccount(account.id));
  const balance = computeAccountBalance(account, txs);

  // Same minimal card for every product type — accounts, fixed income, investments.
  let footer: string | null = null;
  if (account.type === "credit") {
    footer = `${utilizationPct(account, txs).toFixed(0)}% usado`;
  } else if (account.type === "fixed_income" && account.maturityDate) {
    footer = `${daysToMaturity(account)} días restantes`;
  }

  return (
    <Link
      href={`/cuentas/${account.id}`}
      className="flex flex-col h-full min-w-64 max-w-[20rem] w-full shrink-0 transition-transform hover:-translate-y-0.5"
    >
      <PhysicalCard account={account} balance={balance} className="flex-1" />
      {/* Siempre reservar la línea del footer para que todas las cards midan igual. */}
      <div className="mt-2 h-4 text-xs text-muted-foreground truncate text-right">
        {footer ?? " "}
      </div>
    </Link>
  );
}
