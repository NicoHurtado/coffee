"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { computeAccountBalance } from "@/lib/finance/net-worth";
import { formatMoney } from "@/lib/finance/format";
import type { DebitAccount } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sourceAccount: DebitAccount;
  sourceBalance: number;
}

export function TransferToFixedIncomeDialog({ open, onOpenChange, sourceAccount, sourceBalance }: Props) {
  const activeAccounts = useAccountsStore((s) => s.activeAccounts);
  const forAccount = useTransactionsStore((s) => s.forAccount);
  const addTx = useTransactionsStore((s) => s.add);

  const fixedIncomeAccounts = activeAccounts.filter((a) => a.type === "fixed_income");

  const [targetId, setTargetId] = useState<string>(fixedIncomeAccounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const parsed = parseFloat(amount || "0");
  const canConfirm = parsed > 0 && parsed <= sourceBalance && !!targetId;

  const targetAccount = fixedIncomeAccounts.find((a) => a.id === targetId);

  const confirm = async () => {
    if (!canConfirm || !targetAccount) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const pairId = `pair-${Date.now()}`;
      // Debit from source (transfer out)
      await addTx({
        accountId: sourceAccount.id,
        kind: "transfer",
        amount: parsed,
        category: "Transferencia",
        description: `Traslado a ${targetAccount.name}`,
        occurredAt: now,
        transferPairId: pairId,
      });
      // Credit to fixed income as a dated capital inflow (grows from today;
      // previously accrued yield is preserved).
      await addTx({
        accountId: targetId,
        kind: "income",
        amount: parsed,
        category: "Transferencia",
        description: `Traslado desde ${sourceAccount.name}`,
        occurredAt: now,
        transferPairId: pairId,
      });
      toast.success(`${formatMoney(parsed, sourceAccount.currency)} trasladado a ${targetAccount.name}`);
      onOpenChange(false);
      setAmount("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Pasar a renta fija</DialogTitle>

        <div className="space-y-4 pt-1">
          <div className="rounded-xl bg-muted px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Disponible en {sourceAccount.name}</span>
            <span className="text-lg font-bold tabular-nums">
              {formatMoney(sourceBalance, sourceAccount.currency)}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Producto destino</Label>
            {fixedIncomeAccounts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                No tienes productos de renta fija disponibles.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {fixedIncomeAccounts.map((a) => {
                  const bal = computeAccountBalance(a, forAccount(a.id));
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setTargetId(a.id)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition",
                        targetId === a.id
                          ? "border-foreground bg-foreground text-background"
                          : "hover:bg-accent",
                      )}
                    >
                      <span className="font-medium">{a.name}</span>
                      <span className="text-xs opacity-70">{formatMoney(bal, a.currency)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transfer-amount">Monto a trasladar</Label>
            <Input
              id="transfer-amount"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!canConfirm || loading} onClick={confirm}>
            Trasladar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
