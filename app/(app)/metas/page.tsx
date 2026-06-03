"use client";
import Link from "next/link";
import { PageHeader } from "@/components/nav/page-header";
import { Progress } from "@/components/ui/progress";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { computeAccountBalance } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import { colorStyle, type AccountColor } from "@/lib/finance/colors";
import { daysToMaturity } from "@/lib/finance/fixed-income";

export default function MetasPage() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const txs = useTransactionsStore((s) => s.transactions);

  const goals = accounts.filter(
    (a) => a.type === "fixed_income" && a.isGoal && a.goalTarget && a.goalTarget > 0,
  );

  return (
    <div className="p-4 md:p-8 space-y-5">
      <PageHeader eyebrow="Objetivos de ahorro" title="Metas" />

      {goals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aún no tienes metas de ahorro. Crea una cuenta de Renta Fija y márcala
          como meta para verla aquí.
        </div>
      ) : (
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-4">
          {goals.map((a) => {
            if (a.type !== "fixed_income" || !a.goalTarget) return null;
            const balance = computeAccountBalance(a, txs);
            const pct = Math.min(100, (balance / a.goalTarget) * 100);
            const remaining = Math.max(0, a.goalTarget - balance);
            const dtm = daysToMaturity(a);
            const s = colorStyle(a.color as AccountColor | undefined);
            return (
              <Link
                key={a.id}
                href={`/cuentas/${a.id}`}
                className="block rounded-lg border bg-card p-5 space-y-3 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{ background: s.background, color: s.color }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: s.muted }} />
                      {a.name} · {a.institution}
                    </span>
                    <div className="text-lg font-semibold truncate mt-2">
                      {a.goalName ?? a.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Avance</div>
                    <div className="text-lg font-bold tabular-nums">{pct.toFixed(1)}%</div>
                  </div>
                </div>

                <Progress
                  value={pct}
                  className="h-2"
                  style={{ ["--progress-color" as string]: s.muted }}
                />

                <div className="flex items-center justify-between text-sm tabular-nums">
                  <span>
                    <strong>{formatMoney(balance, a.currency)}</strong>
                    <span className="text-muted-foreground"> / {formatMoney(a.goalTarget, a.currency)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Faltan {formatMoney(remaining, a.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{a.annualRate}% anual</span>
                  {dtm != null && <span>{dtm} días restantes</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
