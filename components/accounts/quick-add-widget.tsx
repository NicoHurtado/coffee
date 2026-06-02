"use client";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TypeToggle } from "@/components/transactions/type-toggle";
import { CategoryPicker } from "@/components/transactions/category-picker";
import { AccountPicker } from "@/components/transactions/account-picker";
import { PayCreditCardDialog } from "@/components/accounts/pay-credit-card-dialog";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useAccountsStore } from "@/lib/store/accounts";
import { useSettingsStore } from "@/lib/store/settings";
import { computeAccountBalance } from "@/lib/finance/net-worth";
import type { Account, CreditAccount, TransactionKind } from "@/lib/types";

export function QuickAddWidget({ account }: { account: Account }) {
  const addTx = useTransactionsStore((s) => s.add);
  const txs = useTransactionsStore((s) => s.forAccount(account.id));
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const setLastUsed = useSettingsStore((s) => s.setLastUsedAccount);
  const isCredit = account.type === "credit";

  // For credit: "expense" | "pay". For others: "expense" | "income"
  const [creditMode, setCreditMode] = useState<"expense" | "pay">("expense");
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [destinationId, setDestinationId] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  const isTransfer = kind === "transfer";
  const amountNum = parseFloat(amount || "0");
  const canSubmit = isTransfer
    ? amountNum > 0 && !!destinationId && destinationId !== account.id
    : amountNum > 0 && !!category;

  const submit = async () => {
    if (!canSubmit) return;
    const now = new Date().toISOString();

    if (isTransfer) {
      if (!destinationId || destinationId === account.id) return;
      const dst = accounts.find((a) => a.id === destinationId);
      const pairId = `pair-${Date.now()}`;
      await addTx({
        accountId: account.id,
        kind: "transfer",
        direction: "out",
        amount: amountNum,
        category: "Traslado",
        description: description || (dst ? `Traslado a ${dst.name}` : undefined),
        occurredAt: now,
        transferPairId: pairId,
      });
      await addTx({
        accountId: destinationId,
        kind: "transfer",
        direction: "in",
        amount: amountNum,
        category: "Traslado",
        description: description || `Traslado desde ${account.name}`,
        occurredAt: now,
        transferPairId: pairId,
      });
      await setLastUsed(account.id);
      toast.success("Traslado registrado");
      setAmount("");
      setDescription("");
      setDestinationId(undefined);
      return;
    }

    if (!category) return;
    await addTx({
      accountId: account.id,
      kind,
      amount: amountNum,
      category,
      description: description || undefined,
      occurredAt: now,
    });
    await setLastUsed(account.id);
    toast.success(kind === "income" ? "Ingreso registrado" : "Gasto registrado");
    setAmount("");
    setDescription("");
    setCategory(undefined);
  };

  const currentDebt = isCredit ? computeAccountBalance(account, txs) : 0;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Nueva transacción
      </div>

      {isCredit ? (
        /* Credit toggle: Gasto | Pagar tarjeta */
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted">
          <button
            type="button"
            onClick={() => setCreditMode("expense")}
            className={cn(
              "py-1.5 rounded-md text-sm font-medium transition",
              creditMode === "expense"
                ? "bg-red-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => { setCreditMode("pay"); setPayOpen(true); }}
            className={cn(
              "py-1.5 rounded-md text-sm font-medium transition",
              creditMode === "pay"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pagar tarjeta
          </button>
        </div>
      ) : (
        <TypeToggle value={kind === "income" || kind === "transfer" ? kind : "expense"} onChange={setKind} />
      )}

      {/* Only show form when in expense/income mode (not pay mode for credit) */}
      {(!isCredit || creditMode === "expense") && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="qa-amount">Monto</Label>
            <Input
              id="qa-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-lg font-semibold"
            />
          </div>

          {isTransfer ? (
            <div className="space-y-1.5">
              <Label>Cuenta destino</Label>
              <AccountPicker value={destinationId} onChange={setDestinationId} />
              {destinationId === account.id && (
                <p className="text-xs text-red-500">Elige una cuenta distinta a la actual.</p>
              )}
            </div>
          ) : (
            <CategoryPicker value={category} onChange={setCategory} />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="qa-desc">Descripción</Label>
            <Input
              id="qa-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <Button
            disabled={!canSubmit}
            onClick={submit}
            className="w-full h-11"
          >
            {isTransfer
              ? "Registrar traslado"
              : `Registrar ${isCredit ? "gasto" : kind === "income" ? "ingreso" : "gasto"}`}
          </Button>
        </>
      )}

      {isCredit && (
        <PayCreditCardDialog
          open={payOpen}
          onOpenChange={(o) => { setPayOpen(o); if (!o) setCreditMode("expense"); }}
          creditAccount={account as CreditAccount}
          currentDebt={currentDebt}
        />
      )}
    </div>
  );
}
