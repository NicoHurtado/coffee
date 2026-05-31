"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { computeAccountBalance, toBaseCurrency } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import { NetWorth } from "@/components/home/net-worth";
import { MiniCard } from "@/components/accounts/mini-card";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import type { Account, AccountType } from "@/lib/types";

const GROUPS: { type: AccountType; title: string }[] = [
  { type: "debit", title: "Débito" },
  { type: "credit", title: "Tarjetas de Crédito" },
  { type: "fixed_income", title: "Renta Fija" },
  { type: "investment", title: "Inversiones" },
];

export default function CuentasPage() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.defaultCurrency);
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cuentas</h1>
        <Link href="/cuentas/nueva">
          <Button size="sm" className="gap-1">
            <Plus className="size-4" /> Nueva cuenta
          </Button>
        </Link>
      </div>

      <NetWorth size="lg" />

      <div className="space-y-6">
        {GROUPS.map((g) => {
          const list = accounts.filter((a) => a.type === g.type);
          if (list.length === 0) return null;
          const subtotal = list.reduce((s, a) => s + toBaseCurrency(computeAccountBalance(a, txs), a.currency, usdToCop), 0);
          const isCredit = g.type === "credit";
          return (
            <section key={g.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {g.title}
                </h2>
                <span className={`text-sm font-semibold ${isCredit ? "text-red-500" : ""}`}>
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              <div className="rounded-lg border divide-y">
                {list.map((a: Account) => {
                  const bal = computeAccountBalance(a, txs);
                  return (
                    <Link
                      key={a.id}
                      href={`/cuentas/${a.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-accent/30"
                    >
                      <MiniCard account={a} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{a.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {a.institution}
                          {a.type === "fixed_income" ? ` · ${a.annualRate}% anual` : ""}
                        </div>
                      </div>
                      <div className={`text-right shrink-0 ${isCredit ? "text-red-500" : ""}`}>
                        <div className="text-sm font-semibold tabular-nums">
                          {formatMoney(toBaseCurrency(bal, a.currency, usdToCop), a.currency === "USD" && usdToCop ? "COP" : a.currency)}
                        </div>
                        {a.currency === "USD" && usdToCop && (
                          <div className="text-[11px] text-muted-foreground tabular-nums">
                            {formatMoney(bal, "USD")}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

      </div>
      {accounts.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aún no tienes cuentas. Crea la primera con <strong>+ Nueva cuenta</strong>.
        </div>
      )}
    </div>
  );
}
