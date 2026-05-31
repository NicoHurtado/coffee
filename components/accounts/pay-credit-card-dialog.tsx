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
import { useSettingsStore } from "@/lib/store/settings";
import { formatMoney } from "@/lib/finance/format";
import type { CreditAccount } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  creditAccount: CreditAccount;
  currentDebt: number;
}

export function PayCreditCardDialog({ open, onOpenChange, creditAccount, currentDebt }: Props) {
  const activeAccounts = useAccountsStore((s) => s.activeAccounts);
  const addTx = useTransactionsStore((s) => s.add);
  const currency = useSettingsStore((s) => s.defaultCurrency);

  const sources = activeAccounts.filter(
    (a) => a.type === "debit" || a.type === "fixed_income",
  );

  const [sourceId, setSourceId] = useState<string>(sources[0]?.id ?? "");
  const [paymentType, setPaymentType] = useState<"total" | "parcial">("total");
  const [partialAmount, setPartialAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const payAmount =
    paymentType === "total"
      ? currentDebt
      : parseFloat(partialAmount || "0");

  const sourceAccount = sources.find((a) => a.id === sourceId);
  const canConfirm =
    payAmount > 0 &&
    !!sourceId &&
    (paymentType === "total" || parseFloat(partialAmount || "0") > 0);

  const confirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const pairId = `pair-${Date.now()}`;
      // 1. Reduce debt on credit card (transfer reduces balance)
      await addTx({
        accountId: creditAccount.id,
        kind: "transfer",
        amount: payAmount,
        category: "Transferencia",
        description: `Pago tarjeta`,
        occurredAt: now,
        transferPairId: pairId,
      });
      // 2. Debit from source account
      await addTx({
        accountId: sourceId,
        kind: "transfer",
        amount: payAmount,
        category: "Transferencia",
        description: `Pago ${creditAccount.name}`,
        occurredAt: now,
        transferPairId: pairId,
      });
      toast.success(`Pago de ${formatMoney(payAmount, currency)} registrado`);
      onOpenChange(false);
      // Reset
      setPaymentType("total");
      setPartialAmount("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Pagar tarjeta</DialogTitle>

        <div className="space-y-4 pt-1">
          {/* Deuda actual */}
          <div className="rounded-xl bg-muted px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Deuda actual</span>
            <span className="text-lg font-bold tabular-nums text-red-500">
              {formatMoney(Math.max(0, currentDebt), currency)}
            </span>
          </div>

          {/* Cuenta fuente */}
          <div className="space-y-2">
            <Label className="text-sm">Pagar desde</Label>
            <div className="flex flex-col gap-1.5">
              {sources.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSourceId(a.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition",
                    sourceId === a.id
                      ? "border-foreground bg-foreground text-background"
                      : "hover:bg-accent",
                  )}
                >
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs opacity-70">
                    {a.type === "debit" ? "Débito" : "Renta Fija"}
                  </span>
                </button>
              ))}
              {sources.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  No tienes cuentas débito o renta fija disponibles.
                </p>
              )}
            </div>
          </div>

          {/* Tipo de pago */}
          <div className="space-y-2">
            <Label className="text-sm">Tipo de pago</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["total", "parcial"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPaymentType(t)}
                  className={cn(
                    "py-2 rounded-lg border text-sm font-medium transition capitalize",
                    paymentType === t
                      ? "border-foreground bg-foreground text-background"
                      : "hover:bg-accent",
                  )}
                >
                  {t === "total" ? "Pago total" : "Pago parcial"}
                </button>
              ))}
            </div>
          </div>

          {/* Monto */}
          {paymentType === "total" ? (
            <div className="rounded-xl bg-muted px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monto a pagar</span>
              <span className="text-base font-bold tabular-nums">
                {formatMoney(Math.max(0, currentDebt), currency)}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="partial">Monto a pagar</Label>
              <Input
                id="partial"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!canConfirm || loading} onClick={confirm}>
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
