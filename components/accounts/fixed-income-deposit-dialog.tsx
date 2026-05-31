"use client";
import { useState, useEffect } from "react";
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
import { useTransactionsStore } from "@/lib/store/transactions";
import { formatMoney } from "@/lib/finance/format";
import type { FixedIncomeAccount } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  account: FixedIncomeAccount;
  currentBalance: number;
  initialMode?: "ingreso" | "retiro";
}

export function FixedIncomeDepositDialog({ open, onOpenChange, account, currentBalance, initialMode = "ingreso" }: Props) {
  const addTx = useTransactionsStore((s) => s.add);
  const [mode, setMode] = useState<"ingreso" | "retiro">(initialMode);

  useEffect(() => {
    if (open) { setMode(initialMode); setAmount(""); }
  }, [open, initialMode]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const parsed = parseFloat(amount || "0");
  const newBalance = mode === "ingreso" ? currentBalance + parsed : currentBalance - parsed;
  const canConfirm = parsed > 0 && (mode === "ingreso" || parsed <= currentBalance);

  const confirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      await addTx({
        accountId: account.id,
        kind: "adjustment",
        amount: newBalance,
        category: "Transferencia",
        description: mode === "ingreso" ? "Depósito" : "Retiro",
        occurredAt: new Date().toISOString(),
      });
      toast.success(
        mode === "ingreso"
          ? `Depósito de ${formatMoney(parsed, account.currency)} registrado`
          : `Retiro de ${formatMoney(parsed, account.currency)} registrado`,
      );
      onOpenChange(false);
      setAmount("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{mode === "ingreso" ? "Depositar" : "Retirar"}</DialogTitle>

        <div className="space-y-4 pt-1">
          <div className="rounded-xl bg-muted px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance actual</span>
            <span className="text-lg font-bold tabular-nums">
              {formatMoney(currentBalance, account.currency)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["ingreso", "retiro"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "py-2 rounded-lg border text-sm font-medium transition capitalize",
                  mode === m
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-accent",
                )}
              >
                {m === "ingreso" ? "Depositar" : "Retirar"}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fi-amount">Monto</Label>
            <Input
              id="fi-amount"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {parsed > 0 && (
            <div className="rounded-xl bg-muted px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nuevo balance</span>
              <span className={cn("text-base font-bold tabular-nums", newBalance < 0 && "text-red-500")}>
                {formatMoney(Math.max(0, newBalance), account.currency)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!canConfirm || loading} onClick={confirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
