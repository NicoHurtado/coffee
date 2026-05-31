"use client";
import { use, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { colorStyle, type AccountColor } from "@/lib/finance/colors";
import { PhysicalCard } from "@/components/accounts/physical-card";
import { QuickAddWidget } from "@/components/accounts/quick-add-widget";
import { PayCreditCardDialog } from "@/components/accounts/pay-credit-card-dialog";
import { FixedIncomeDepositDialog } from "@/components/accounts/fixed-income-deposit-dialog";
import { TransferToFixedIncomeDialog } from "@/components/accounts/transfer-to-fixed-income-dialog";
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { AccountCategoryPie } from "@/components/accounts/account-category-pie";
import { AccountPeriodBars } from "@/components/accounts/account-period-bars";
import { AccountActivity } from "@/components/accounts/account-activity";

function InvestmentCopCard({ balance }: { balance: number }) {
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const cop = usdToCop ? balance * usdToCop : null;
  return (
    <div className="rounded-2xl border bg-card p-4 flex-1 flex flex-col justify-center gap-1">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Valor en USD</div>
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
  const account = useAccountsStore((s) => s.getById(id));
  const txs = useTransactionsStore((s) => s.forAccount(id));
  const addTx = useTransactionsStore((s) => s.add);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  const [updateOpen, setUpdateOpen] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [chartsOpen, setChartsOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositMode, setDepositMode] = useState<"ingreso" | "retiro">("ingreso");
  const [transferOpen, setTransferOpen] = useState(false);
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

  const usdToCopRate = useExchangeRateStore((s) => s.usdToCop);

  if (!account) {
    return (
      <div className="p-8 text-center text-muted-foreground">Cuenta no encontrada.</div>
    );
  }

  const balance = computeAccountBalance(account, txs);
  const isInvestmentUsd = account.type === "investment" && account.currency === "USD";
  const copValue = isInvestmentUsd && usdToCopRate ? balance * usdToCopRate : null;
  const displayBalanceStr = copValue !== null
    ? Math.round(copValue).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
    : formatMoney(balance, account.currency);

  const handleUpdateBalance = () => {
    const n = parseFloat(newBalance);
    if (!isFinite(n)) return;
    addTx({
      accountId: account.id,
      kind: "adjustment",
      amount: n,
      category: "Otro",
      description: "Actualización de balance",
      occurredAt: new Date().toISOString(),
    });
    toast.success("Balance actualizado");
    setUpdateOpen(false);
    setNewBalance("");
  };

  const TYPE_LABEL = {
    debit: "Débito",
    credit: "Crédito",
    fixed_income: "Renta Fija",
    investment: "Inversión",
  } as const;

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
          <div className="flex gap-2">
            {account.type === "investment" && (account as import("@/lib/types").InvestmentAccount).syncUrl && (
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => syncBalance()}
                disabled={syncing}
              >
                {syncing ? "Sincronizando…" : "↻ Sincronizar"}
              </Button>
            )}
            <Button className="flex-1 h-12" onClick={() => setUpdateOpen(true)}>
              Actualizar Balance
            </Button>
          </div>
        );
    }
  })();

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-8 space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/cuentas" className="size-9 rounded-md hover:bg-accent flex items-center justify-center">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-medium md:text-lg md:font-semibold">Detalle de Cuenta</h1>
        <Link
          href={`/cuentas/${account.id}/editar`}
          className="size-9 rounded-md hover:bg-accent flex items-center justify-center"
          aria-label="Editar"
        >
          <Pencil className="size-4" />
        </Link>
      </div>

      {/* MOBILE LAYOUT — unchanged */}
      <div className="md:hidden flex flex-col gap-5">
        {account.type === "debit" || account.type === "credit" ? (
          <div className="w-full max-w-md mx-auto">
            <PhysicalCard account={account} balance={balance} />
          </div>
        ) : (
          (() => {
            const s = colorStyle(account.color as AccountColor | undefined);
            return (
              <div className="rounded-2xl p-5 space-y-2 border bg-card">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide"
                    style={{ background: s.background, color: s.color }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: s.muted }} />
                    {TYPE_LABEL[account.type]}
                  </span>
                  {account.type === "fixed_income" && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {account.annualRate}% anual
                    </span>
                  )}
                </div>
                <div className="text-2xl font-semibold mt-2">{account.name}</div>
                <div className="text-sm text-muted-foreground">{account.institution}</div>
                <div className="text-4xl font-bold tabular-nums mt-3">
                  {displayBalanceStr}
                </div>
                {isInvestmentUsd && (
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {formatMoney(balance, account.currency)} USD
                  </div>
                )}
                {account.type === "fixed_income" && account.maturityDate && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Vence: {account.maturityDate}
                  </div>
                )}
              </div>
            );
          })()
        )}

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
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Límite utilizado</div>
                <div className="text-lg font-semibold text-red-500 tabular-nums">
                  {utilizationPct(account, txs).toFixed(0)}%
                </div>
                <Progress className="mt-2" value={Math.min(100, utilizationPct(account, txs))} />
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Crédito disponible</div>
                <div className="text-lg font-semibold text-emerald-600 tabular-nums">
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
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Rendimiento</div>
                <div className="text-base font-semibold text-emerald-600 tabular-nums">
                  {formatMoney(accruedYield(account, txs), account.currency)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Tasa anual</div>
                <div className="text-base font-semibold tabular-nums">{account.annualRate}%</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance inicial</div>
                <div className="text-base font-semibold tabular-nums">
                  {formatMoney(account.initialBalance, account.currency)}
                </div>
              </div>
              {account.maturityDate ? (
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Días restantes</div>
                  <div className="text-base font-semibold tabular-nums">{daysToMaturity(account)}</div>
                </div>
              ) : (
                <div className="rounded-lg border p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Vencimiento</div>
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

        <AccountActivity accountId={account.id} />
      </div>

      {/* DESKTOP LAYOUT — reorganized, no info card, balanced heights */}
      <div className="hidden md:flex md:flex-col md:gap-6">
        {/* Row 1: Card (with metrics stacked below) + QuickAdd / Action */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* ── Left column ── */}
          <div className="col-span-5 flex flex-col gap-4">
            {account.type === "debit" || account.type === "credit" ? (
              <div className="w-full">
                <PhysicalCard account={account} balance={balance} />
              </div>
            ) : (
              (() => {
                const s = colorStyle(account.color as AccountColor | undefined);
                return (
                  <div className="w-full rounded-2xl p-6 space-y-2 border bg-card flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide"
                        style={{ background: s.background, color: s.color }}
                      >
                        <span className="size-1.5 rounded-full" style={{ background: s.muted }} />
                        {TYPE_LABEL[account.type]}
                      </span>
                      {account.type === "fixed_income" && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {account.annualRate}% anual
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-semibold mt-2">{account.name}</div>
                    <div className="text-sm text-muted-foreground">{account.institution}</div>
                    <div className="text-4xl font-bold tabular-nums mt-3">
                      {displayBalanceStr}
                    </div>
                    {isInvestmentUsd && (
                      <div className="text-xs text-muted-foreground tabular-nums mt-1">
                        {formatMoney(balance, account.currency)} USD
                      </div>
                    )}
                    {account.type === "fixed_income" && account.maturityDate && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Vence: {account.maturityDate}
                      </div>
                    )}
                  </div>
                );
              })()
            )}

            {/* Credit metrics under card */}
            {account.type === "credit" && (
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="rounded-2xl border bg-card p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Límite utilizado</div>
                  <div>
                    <div className="text-xl font-bold text-red-500 tabular-nums">
                      {utilizationPct(account, txs).toFixed(0)}%
                    </div>
                    <Progress className="mt-2" value={Math.min(100, utilizationPct(account, txs))} />
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-4 flex flex-col justify-between">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Crédito disponible</div>
                  <div>
                    <div className="text-xl font-bold text-emerald-600 tabular-nums">
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
                <div className="rounded-2xl border bg-card p-4 space-y-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Acción rápida
                  </div>
                  {actionButton}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border bg-card p-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Rendimiento</div>
                    <div className="text-lg font-bold text-emerald-600 tabular-nums mt-1">
                      {formatMoney(accruedYield(account, txs), account.currency)}
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-card p-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Tasa anual</div>
                    <div className="text-lg font-bold tabular-nums mt-1">{account.annualRate}%</div>
                  </div>
                  <div className="rounded-2xl border bg-card p-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance inicial</div>
                    <div className="text-lg font-bold tabular-nums mt-1">
                      {formatMoney(account.initialBalance, account.currency)}
                    </div>
                  </div>
                  {account.maturityDate ? (
                    <div className="rounded-2xl border bg-card p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Días restantes</div>
                      <div className="text-lg font-bold tabular-nums mt-1">{daysToMaturity(account)}</div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border bg-card p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Vencimiento</div>
                      <div className="text-lg font-bold tabular-nums mt-1 text-muted-foreground">Sin fecha</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Investment: action buttons + COP card filling the rest */
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border bg-card p-4 space-y-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
              className="flex items-center justify-between w-full p-4 border rounded-2xl bg-card hover:bg-accent/40 transition-colors"
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

        {/* Row 3: Activity full width */}
        <AccountActivity accountId={account.id} />
      </div>

      {account.type === "investment" && (
        <div className="md:hidden fixed bottom-20 inset-x-0 px-4">{actionButton}</div>
      )}

      {account.type === "credit" && (
        <PayCreditCardDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          creditAccount={account}
          currentDebt={balance}
        />
      )}

      {account.type === "fixed_income" && (
        <FixedIncomeDepositDialog
          open={depositOpen}
          onOpenChange={setDepositOpen}
          account={account}
          currentBalance={balance}
          initialMode={depositMode}
        />
      )}

      {account.type === "debit" && (
        <TransferToFixedIncomeDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          sourceAccount={account}
          sourceBalance={balance}
        />
      )}

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogTitle>Actualizar Balance</DialogTitle>
          <div className="space-y-2 py-2">
            <Label htmlFor="bal">Nuevo balance</Label>
            <Input
              id="bal"
              type="number"
              inputMode="decimal"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateBalance}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
