"use client";
import { use, useState, useCallback, useEffect, useMemo } from "react";
import { startOfMonth } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, ChevronDown, Scale } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useUIStore } from "@/lib/store/ui";
import { computeAccountBalance } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import {
  utilizationPct,
  availableCredit,
} from "@/lib/finance/credit";
import { accruedYield, daysToMaturity } from "@/lib/finance/fixed-income";
import { PhysicalCard } from "@/components/accounts/physical-card";
import { QuickAddWidget } from "@/components/accounts/quick-add-widget";
import { PayCreditCardDialog } from "@/components/accounts/pay-credit-card-dialog";
import { FixedIncomeDepositDialog } from "@/components/accounts/fixed-income-deposit-dialog";
import { TransferToFixedIncomeDialog } from "@/components/accounts/transfer-to-fixed-income-dialog";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { AccountCategoryPie } from "@/components/accounts/account-category-pie";
import { AccountPeriodBars } from "@/components/accounts/account-period-bars";
import { AccountActivity } from "@/components/accounts/account-activity";
import { AdjustBalanceDialog } from "@/components/accounts/adjust-balance-dialog";
import { InvestmentBalanceChart } from "@/components/accounts/investment-balance-chart";

function InvestmentCopCard({ balance }: { balance: number }) {
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const cop = usdToCop ? balance * usdToCop : null;
  return (
    <div className="surface rounded-2xl p-4 flex-1 flex flex-col justify-center gap-1">
      <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Valor en USD</div>
      <div className="text-3xl font-bold tabular-nums">
        ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {cop !== null && (
        <div className="text-xs text-muted-foreground tabular-nums">
          {Math.round(cop).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} COP
        </div>
      )}
    </div>
  );
}

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const account = useAccountsStore((s) => s.getById(id));
  const txs = useTransactionsStore((s) => s.forAccount(id));
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  const [chartsOpen, setChartsOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositMode, setDepositMode] = useState<"ingreso" | "retiro">("ingreso");
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const refreshTxs = useTransactionsStore((s) => s.refresh);
  const refreshAccounts = useAccountsStore((s) => s.refresh);

  const syncBalance = useCallback(async (silent = false) => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/accounts/${id}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al sincronizar");
      if (!silent) toast.success(`Balance sincronizado: ${data.balance.toLocaleString()}`);
      await Promise.all([refreshTxs(), refreshAccounts()]);
    } catch (err) {
      if (!silent) toast.error(err instanceof Error ? err.message : "Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  }, [id, refreshTxs, refreshAccounts]);

  // Auto-sync once per day for investment accounts with sync configured
  useEffect(() => {
    if (account?.type !== "investment") return;
    const inv = account as import("@/lib/types").InvestmentAccount;
    if (!inv.syncUrl) return;
    const today = new Date().toISOString().slice(0, 10);
    if (inv.lastSyncDate === today) return; // already synced today
    syncBalance(true); // silent auto-sync
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.type, (account as import("@/lib/types").InvestmentAccount)?.lastSyncDate]);

  // Volver con el historial del navegador es instantáneo: restaura la página
  // anterior ya renderizada (router cache) en vez de disparar una navegación
  // nueva que vuelve a pedir el RSC de /cuentas al servidor. Si se entró por
  // enlace directo (sin historial), se cae al push normal.
  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/cuentas");
    }
  }, [router]);

  if (!account) {
    return (
      <div className="p-8 text-center text-muted-foreground">Cuenta no encontrada.</div>
    );
  }

  const balance = computeAccountBalance(account, txs);

  // Month-to-date flow summary for the account (used to fill the debit detail).
  const monthStats = useMemo(() => {
    const ms = startOfMonth(new Date());
    let income = 0;
    let expense = 0;
    let count = 0;
    for (const t of txs) {
      if (new Date(t.occurredAt) < ms) continue;
      count++;
      if (t.kind === "income") income += t.amount;
      else if (t.kind === "expense") expense += t.amount;
    }
    return { income, expense, net: income - expense, count };
  }, [txs]);

  const isInvestmentUsd = account.type === "investment" && account.currency === "USD";

  const actionButton = (() => {
    switch (account.type) {
      case "debit":
        return (
          <div className="flex flex-col gap-2">
            <Button
              className="w-full h-12"
              onClick={() => openQuickAdd({ accountId: account.id })}
            >
              Registrar Transacción
            </Button>
            <Button
              variant="outline"
              className="w-full h-10"
              onClick={() => setTransferOpen(true)}
            >
              Pasar a renta fija
            </Button>
          </div>
        );
      case "credit":
        return (
          <Button className="w-full h-12" onClick={() => setPayOpen(true)}>
            Pagar tarjeta
          </Button>
        );
      case "fixed_income":
        return (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12" onClick={() => { setDepositMode("retiro"); setDepositOpen(true); }}>
              Retirar
            </Button>
            <Button className="flex-1 h-12" onClick={() => { setDepositMode("ingreso"); setDepositOpen(true); }}>
              Depositar
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-12" onClick={() => { setDepositMode("retiro"); setDepositOpen(true); }}>
                Retirar
              </Button>
              <Button className="flex-1 h-12" onClick={() => { setDepositMode("ingreso"); setDepositOpen(true); }}>
                Depositar
              </Button>
            </div>
            {account.type === "investment" && (account as import("@/lib/types").InvestmentAccount).syncUrl && (
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => syncBalance()}
                disabled={syncing}
              >
                {syncing ? "Sincronizando…" : "↻ Sincronizar"}
              </Button>
            )}
          </div>
        );
    }
  })();

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8 space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          aria-label="Volver"
          className="size-9 rounded-md hover:bg-accent flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-medium md:text-lg md:font-semibold">Detalle de Cuenta</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAdjustOpen(true)}
            className="size-9 rounded-md hover:bg-accent flex items-center justify-center"
            aria-label="Ajustar balance"
            title="Ajustar balance"
          >
            <Scale className="size-4" />
          </button>
          <Link
            href={`/cuentas/${account.id}/editar`}
            className="size-9 rounded-md hover:bg-accent flex items-center justify-center"
            aria-label="Editar"
          >
            <Pencil className="size-4" />
          </Link>
        </div>
      </div>

      {/* MOBILE LAYOUT — unchanged */}
      <div className="md:hidden flex flex-col gap-5">
        <div className="w-full max-w-md mx-auto">
          <PhysicalCard account={account} balance={balance} />
          {isInvestmentUsd && (
            <div className="mt-2 text-xs text-muted-foreground tabular-nums text-right">
              {formatMoney(balance, account.currency)} USD
            </div>
          )}
          {account.type === "fixed_income" && account.maturityDate && (
            <div className="mt-2 text-xs text-muted-foreground text-right">
              Vence: {account.maturityDate}
            </div>
          )}
        </div>

        {account.type === "debit" && (
          <button
            type="button"
            onClick={() => setTransferOpen(true)}
            className="w-full rounded-lg border py-2.5 text-sm font-medium hover:bg-accent transition"
          >
            Pasar a renta fija
          </button>
        )}

        {account.type === "credit" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Límite utilizado</div>
                <div className="text-lg font-semibold text-destructive tabular-nums">
                  {utilizationPct(account, txs).toFixed(0)}%
                </div>
                <Progress className="mt-2" value={Math.min(100, utilizationPct(account, txs))} />
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Crédito disponible</div>
                <div className="text-lg font-semibold text-positive tabular-nums">
                  {formatMoney(availableCredit(account, txs), account.currency)}
                </div>
                <Progress
                  className="mt-2"
                  value={
                    account.creditLimit > 0
                      ? (availableCredit(account, txs) / account.creditLimit) * 100
                      : 0
                  }
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="w-full rounded-lg border py-2.5 text-sm font-medium hover:bg-accent transition"
            >
              Pagar tarjeta
            </button>
          </div>
        )}

        {account.type === "fixed_income" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Rendimiento</div>
                <div className="text-base font-semibold text-positive tabular-nums">
                  {formatMoney(accruedYield(account, txs), account.currency)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Tasa anual</div>
                <div className="text-base font-semibold tabular-nums">{account.annualRate}%</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Balance inicial</div>
                <div className="text-base font-semibold tabular-nums">
                  {formatMoney(account.initialBalance, account.currency)}
                </div>
              </div>
              {account.maturityDate ? (
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Días restantes</div>
                  <div className="text-base font-semibold tabular-nums">{daysToMaturity(account)}</div>
                </div>
              ) : (
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Vencimiento</div>
                  <div className="text-base font-semibold tabular-nums text-muted-foreground">Sin fecha</div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => { setDepositMode("retiro"); setDepositOpen(true); }}>
                Retirar
              </Button>
              <Button className="flex-1 h-11" onClick={() => { setDepositMode("ingreso"); setDepositOpen(true); }}>
                Depositar
              </Button>
            </div>
          </>
        )}

        {(account.type === "debit" || account.type === "credit") && (
          <>
            <button
              onClick={() => setChartsOpen(!chartsOpen)}
              className="flex items-center justify-between w-full p-4 border rounded-xl bg-card hover:bg-accent/50 transition-colors"
            >
              <span className="font-medium text-sm">Estadísticas de gastos</span>
              <ChevronDown
                className={cn("size-5 text-muted-foreground transition-transform", chartsOpen && "rotate-180")}
              />
            </button>
            {chartsOpen && (
              <div className="flex flex-col gap-5">
                <AccountCategoryPie accountId={account.id} />
                <AccountPeriodBars accountId={account.id} />
              </div>
            )}
          </>
        )}

        {account.type === "investment" && (
          <>
            <InvestmentBalanceChart account={account} />
            {actionButton}
          </>
        )}

        <AccountActivity accountId={account.id} />
      </div>

      {/* DESKTOP LAYOUT — reorganized, no info card, balanced heights */}
      <div className="hidden md:flex md:flex-col md:gap-6">
        {/* Row 1: Card (with metrics stacked below) + QuickAdd / Action */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* ── Left column ── */}
          <div className="col-span-5 flex flex-col gap-4">
            <div className="w-full">
              <PhysicalCard account={account} balance={balance} />
              {isInvestmentUsd && (
                <div className="mt-2 text-xs text-muted-foreground tabular-nums text-right">
                  {formatMoney(balance, account.currency)} USD
                </div>
              )}
              {account.type === "fixed_income" && account.maturityDate && (
                <div className="mt-2 text-xs text-muted-foreground text-right">
                  Vence: {account.maturityDate}
                </div>
              )}
            </div>

            {/* Debit summary under card — fills the column height */}
            {account.type === "debit" && (
              <div className="surface rounded-2xl p-5 flex-1 flex flex-col">
                <div className="text-[12px] font-medium tracking-[-0.005em] text-muted-foreground">
                  Resumen del mes
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[12px] font-medium tracking-[-0.005em] text-muted-foreground">
                      Ingresos
                    </div>
                    <div className="text-xl font-semibold tabular-nums text-positive mt-1">
                      +{formatMoney(monthStats.income, account.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-medium tracking-[-0.005em] text-muted-foreground">
                      Gastos
                    </div>
                    <div className="text-xl font-semibold tabular-nums text-destructive mt-1">
                      -{formatMoney(monthStats.expense, account.currency)}
                    </div>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-medium tracking-[-0.005em] text-muted-foreground">
                      Flujo neto
                    </div>
                    <div
                      className={cn(
                        "text-2xl font-bold tabular-nums mt-1",
                        monthStats.net >= 0 ? "text-positive" : "text-destructive",
                      )}
                    >
                      {monthStats.net >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(monthStats.net), account.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-medium tracking-[-0.005em] text-muted-foreground">
                      Movimientos
                    </div>
                    <div className="text-2xl font-bold tabular-nums mt-1">{monthStats.count}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Credit metrics under card */}
            {account.type === "credit" && (
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="surface rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Límite utilizado</div>
                  <div>
                    <div className="text-xl font-bold text-destructive tabular-nums">
                      {utilizationPct(account, txs).toFixed(0)}%
                    </div>
                    <Progress className="mt-2" value={Math.min(100, utilizationPct(account, txs))} />
                  </div>
                </div>
                <div className="surface rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Crédito disponible</div>
                  <div>
                    <div className="text-xl font-bold text-positive tabular-nums">
                      {formatMoney(availableCredit(account, txs), account.currency)}
                    </div>
                    <Progress
                      className="mt-2"
                      value={
                        account.creditLimit > 0
                          ? (availableCredit(account, txs) / account.creditLimit) * 100
                          : 0
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Investment COP card moved to right column */}
          </div>

          {/* ── Right column ── */}
          <div className="col-span-7">
            {account.type === "debit" || account.type === "credit" ? (
              <div className="h-full flex flex-col gap-3">
                <QuickAddWidget account={account} />
                {account.type === "debit" && (
                  <Button variant="outline" className="w-full h-10" onClick={() => setTransferOpen(true)}>
                    Pasar a renta fija
                  </Button>
                )}
              </div>
            ) : account.type === "fixed_income" ? (
              /* Fixed income: action buttons at top + metrics grid filling the rest */
              <div className="flex flex-col gap-4">
                <div className="surface rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-medium tracking-[-0.005em] text-muted-foreground">
                    Acción rápida
                  </div>
                  {actionButton}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="surface rounded-2xl p-4">
                    <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Rendimiento</div>
                    <div className="text-lg font-bold text-positive tabular-nums mt-1">
                      {formatMoney(accruedYield(account, txs), account.currency)}
                    </div>
                  </div>
                  <div className="surface rounded-2xl p-4">
                    <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Tasa anual</div>
                    <div className="text-lg font-bold tabular-nums mt-1">{account.annualRate}%</div>
                  </div>
                  <div className="surface rounded-2xl p-4">
                    <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Balance inicial</div>
                    <div className="text-lg font-bold tabular-nums mt-1">
                      {formatMoney(account.initialBalance, account.currency)}
                    </div>
                  </div>
                  {account.maturityDate ? (
                    <div className="surface rounded-2xl p-4">
                      <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Días restantes</div>
                      <div className="text-lg font-bold tabular-nums mt-1">{daysToMaturity(account)}</div>
                    </div>
                  ) : (
                    <div className="surface rounded-2xl p-4">
                      <div className="text-[10px] text-muted-foreground tracking-[-0.005em]">Vencimiento</div>
                      <div className="text-lg font-bold tabular-nums mt-1 text-muted-foreground">Sin fecha</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Investment: action buttons + COP card filling the rest */
              <div className="flex flex-col gap-4">
                <div className="surface rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-medium tracking-[-0.005em] text-muted-foreground">
                    Acción rápida
                  </div>
                  {actionButton}
                </div>
                {account.type === "investment" && account.currency === "USD" && (
                  <InvestmentCopCard balance={balance} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Stats charts — only for debit/credit */}
        {(account.type === "debit" || account.type === "credit") && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setChartsOpen(!chartsOpen)}
              className="flex items-center justify-between w-full p-4 surface rounded-2xl hover:bg-accent/40 transition-colors"
            >
              <div className="text-left">
                <div className="text-sm font-semibold">Estadísticas de gastos</div>
                <div className="text-xs text-muted-foreground">
                  Gastos por categoría y por período
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "size-5 text-muted-foreground transition-transform",
                  chartsOpen && "rotate-180",
                )}
              />
            </button>

            {chartsOpen && (
              <div className="grid grid-cols-2 gap-6 items-stretch">
                <AccountCategoryPie accountId={account.id} />
                <AccountPeriodBars accountId={account.id} />
              </div>
            )}
          </div>
        )}

        {/* Row 2.5: Investment balance movement chart */}
        {account.type === "investment" && (
          <InvestmentBalanceChart account={account} />
        )}

        {/* Row 3: Activity full width */}
        <AccountActivity accountId={account.id} />
      </div>

      {account.type === "credit" && (
        <PayCreditCardDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          creditAccount={account}
          currentDebt={balance}
        />
      )}

      {(account.type === "fixed_income" || account.type === "investment") && (
        <FixedIncomeDepositDialog
          open={depositOpen}
          onOpenChange={setDepositOpen}
          account={account}
          currentBalance={balance}
          initialMode={depositMode}
        />
      )}

      <AdjustBalanceDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        account={account}
        currentBalance={balance}
      />

      {account.type === "debit" && (
        <TransferToFixedIncomeDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          sourceAccount={account}
          sourceBalance={balance}
        />
      )}
    </div>
  );
}
