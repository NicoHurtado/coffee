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
import { PageHeader, SectionHeading } from "@/components/nav/page-header";
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

  const totalAssets = accounts.reduce((s, a) => {
    if (a.type === "credit") return s;
    return s + toBaseCurrency(computeAccountBalance(a, txs), a.currency, usdToCop);
  }, 0);
  const totalDebt = accounts.reduce((s, a) => {
    if (a.type !== "credit") return s;
    return s + toBaseCurrency(computeAccountBalance(a, txs), a.currency, usdToCop);
  }, 0);

  return (
    <div className="p-4 md:p-8">
      <div className="space-y-6">
        <PageHeader eyebrow="Portafolio" title="Cuentas">
          <Link href="/cuentas/nueva">
            <Button size="sm" className="gap-1">
              <Plus className="size-4" /> Nueva cuenta
            </Button>
          </Link>
        </PageHeader>

        {/* Net worth + summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border">
          <div className="bg-card p-5 sm:col-span-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Patrimonio neto
            </div>
            <NetWorth size="lg" />
          </div>
          <div className="bg-card p-5 flex flex-col justify-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Activos
            </div>
            <div className="text-xl font-semibold tabular-nums text-primary mt-1">
              {formatMoney(totalAssets, currency)}
            </div>
          </div>
          <div className="bg-card p-5 flex flex-col justify-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Deuda
            </div>
            <div className="text-xl font-semibold tabular-nums text-destructive mt-1">
              {totalDebt > 0 ? "-" : ""}
              {formatMoney(totalDebt, currency)}
            </div>
          </div>
        </div>

        <div className="space-y-7">
          {GROUPS.map((g) => {
            const list = accounts.filter((a) => a.type === g.type);
            if (list.length === 0) return null;
            const subtotal = list.reduce((s, a) => s + toBaseCurrency(computeAccountBalance(a, txs), a.currency, usdToCop), 0);
            const isCredit = g.type === "credit";
            return (
              <section key={g.type} className="space-y-2.5">
                <SectionHeading
                  right={
                    <span
                      className={`text-sm font-semibold tabular-nums ${isCredit ? "text-destructive" : ""}`}
                    >
                      {isCredit && subtotal > 0 ? "-" : ""}
                      {formatMoney(subtotal, currency)}
                    </span>
                  }
                >
                  {g.title} · {list.length}
                </SectionHeading>
                <div className="overflow-hidden rounded-lg border bg-card divide-y">
                  {list.map((a: Account) => {
                    const bal = computeAccountBalance(a, txs);
                    const meta =
                      a.type === "fixed_income"
                        ? `${a.institution} · ${a.annualRate}% anual`
                        : a.institution;
                    return (
                      <Link
                        key={a.id}
                        href={`/cuentas/${a.id}`}
                        className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/50"
                      >
                        <MiniCard account={a} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{a.name}</div>
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                            {meta}
                          </div>
                        </div>
                        <div className={`text-right shrink-0 ${isCredit ? "text-destructive" : ""}`}>
                          <div className="text-sm font-semibold tabular-nums">
                            {isCredit && bal > 0 ? "-" : ""}
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
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aún no tienes cuentas. Crea la primera con <strong>+ Nueva cuenta</strong>.
          </div>
        )}
      </div>
    </div>
  );
}
