"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionHeading } from "@/components/nav/page-header";
import { SubscriptionDialog } from "@/components/accounts/subscription-dialog";
import { useSubscriptionsStore } from "@/lib/store/subscriptions";
import { useAccountsStore } from "@/lib/store/accounts";
import { formatMoney } from "@/lib/finance/format";
import { monthlyTotal, nextChargeDate } from "@/lib/finance/subscriptions";
import type { Subscription } from "@/lib/types";

export default function SuscripcionesPage() {
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const accounts = useAccountsStore((s) => s.accounts);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sorted = [...subscriptions].sort((a, b) => a.billingDay - b.billingDay);
  const totalCop = monthlyTotal(subscriptions, "COP");
  const totalUsd = monthlyTotal(subscriptions, "USD");

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (s: Subscription) => {
    setEditing(s);
    setDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cuentas"
          title="Suscripciones"
          subtitle="Se registran solas cada mes en la fecha de cobro."
        >
          <Link href="/cuentas">
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowLeft className="size-4" /> Cuentas
            </Button>
          </Link>
          <Button size="sm" className="gap-1" onClick={openNew}>
            <Plus className="size-4" /> Nueva suscripción
          </Button>
        </PageHeader>

        {(totalCop > 0 || totalUsd > 0) && (
          <div
            className={`grid gap-px overflow-hidden rounded-lg border bg-border ${
              totalCop > 0 && totalUsd > 0 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {totalCop > 0 && (
              <div className="bg-card p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
                  Total mensual (COP)
                </div>
                <div className="text-xl font-semibold tabular-nums">{formatMoney(totalCop, "COP")}</div>
              </div>
            )}
            {totalUsd > 0 && (
              <div className="bg-card p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
                  Total mensual (USD)
                </div>
                <div className="text-xl font-semibold tabular-nums">{formatMoney(totalUsd, "USD")}</div>
              </div>
            )}
          </div>
        )}

        <section className="space-y-2.5">
          <SectionHeading>Tus suscripciones · {sorted.length}</SectionHeading>
          {sorted.length > 0 && (
          <div className="overflow-hidden rounded-lg border bg-card divide-y">
            {sorted.map((s) => {
              const account = accounts.find((a) => a.id === s.accountId);
              const next = nextChargeDate(s.billingDay);
              return (
                <button
                  key={s.id}
                  onClick={() => openEdit(s)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Repeat className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{s.name}</span>
                      {!s.active && (
                        <Badge variant="secondary" className="text-[9px]">Pausada</Badge>
                      )}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                      {account?.name ?? "Cuenta eliminada"} · Día {s.billingDay} · Próx.{" "}
                      {next.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular-nums">
                      {formatMoney(s.amount, s.currency)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{s.category}</div>
                  </div>
                </button>
              );
            })}
          </div>
          )}

          {sorted.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aún no tienes suscripciones. Añade la primera con{" "}
              <strong>+ Nueva suscripción</strong> y se cobrará sola cada mes.
            </div>
          )}
        </section>
      </div>

      <SubscriptionDialog subscription={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
