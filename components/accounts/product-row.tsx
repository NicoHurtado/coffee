"use client";
import Link from "next/link";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { computeAccountBalance } from "@/lib/finance/net-worth";
import { daysToMaturity } from "@/lib/finance/fixed-income";
import { formatMoney } from "@/lib/finance/format";
import { getColorDef, type AccountColor } from "@/lib/finance/colors";
import { savingsIcon, savingsSubtitle } from "./savings-face";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/types";

/**
 * Renta fija e inversiones no son plástico y forzarlas al formato de una
 * tarjeta las hacía ver como lo que no son. Aquí van como lo que sí son:
 * una fila de producto —ícono, nombre y saldo— que se lee de corrido junto a
 * sus hermanas y no compite con el arte de las tarjetas reales.
 */
export function ProductRow({ account, className }: { account: Account; className?: string }) {
  const txs = useTransactionsStore((s) => s.forAccount(account.id));
  const balance = computeAccountBalance(account, txs);
  const accent = getColorDef(account.color as AccountColor | undefined).base;
  const type = account.type as "fixed_income" | "investment";

  const subtitle = savingsSubtitle(
    type,
    account.name,
    account.institution,
    account.type === "fixed_income" ? account.annualRate : undefined,
  );

  const footnote =
    account.type === "fixed_income" && account.maturityDate
      ? `${daysToMaturity(account)} días restantes`
      : type === "investment"
        ? "Valor actual"
        : "Saldo";

  return (
    <Link
      href={`/cuentas/${account.id}`}
      className={cn(
        "surface flex items-center gap-4 px-4 py-3.5 transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
      >
        {savingsIcon(type, "size-6")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{account.name}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-base font-semibold tabular-nums">
          {formatMoney(balance, account.currency)}
        </div>
        <div className="text-[11px] text-muted-foreground">{footnote}</div>
      </div>
    </Link>
  );
}

/** Las filas de todos los productos que no son tarjeta, agrupadas. */
export function ProductList({ className }: { className?: string }) {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const products = accounts.filter(
    (a) => a.type === "fixed_income" || a.type === "investment",
  );
  if (products.length === 0) return null;
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {products.map((a) => (
        <ProductRow key={a.id} account={a} />
      ))}
    </div>
  );
}
