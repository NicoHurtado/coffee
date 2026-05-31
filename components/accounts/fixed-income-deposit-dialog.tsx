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
import { useExchangeRateStore } from "@/lib/store/exchange-rate";
import { formatMoney } from "@/lib/finance/format";
import type { FixedIncomeAccount, InvestmentAccount } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  account: FixedIncomeAccount | InvestmentAccount;
  currentBalance: number;
  initialMode?: "ingreso" | "retiro";
}

export function FixedIncomeDepositDialog({ open, onOpenChange, account, currentBalance, initialMode = "ingreso" }: Props) {
  const addTx = useTransactionsStore((s) => s.add);
  const usdToCop = useExchangeRateStore((s) => s.usdToCop);
  const [mode, setMode] = useState<"ingreso" | "retiro">(initialMode);

  useEffect(() => {
    if (open) { setMode(initialMode); setAmount(""); setDescription(""); }
  }, [open, initialMode]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const parsed = parseFloat(amount || "0");
  const showCop = account.currency === "USD" && !!usdToCop;
  const copAmount = showCop ? parsed * (usdToCop as number) : 0;
  const fmtCop = (n: number) =>
    Math.round(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  const newBalance = mode === "ingreso" ? currentBalance + parsed : currentBalance - parsed;
  const canConfirm = parsed > 0 && (mode === "ingreso" || parsed <= currentBalance);

  const confirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const defaultDesc = mode === "ingreso" ? "Depósito" : "Retiro";
      if (account.type === "fixed_income") {
        // Renta fija: registrar el movimiento como flujo de capital con su fecha.
        // El depósito crece desde hoy y el rendimiento ya ganado se conserva.
        await addTx({
          accountId: account.id,
          kind: mode === "ingreso" ? "income" : "expense",
          amount: parsed,
          category: "Transferencia",
          description: description.trim() || defaultDesc,
          occurredAt: new Date().toISOString(),
        });
      } else {
        // Inversión: el balance es un snapshot absoluto (no se simula crecimiento).
        await addTx({
          accountId: account.id,
          kind: "adjustment",
          amount: newBalance,
          category: "Transferencia",
          description: description.trim() || defaultDesc,
          occurredAt: new Date().toISOString(),
        });
      }
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
            <Label htmlFor="fi-amount">
              Monto {account.currency === "USD" ? "(USD)" : ""}
            </Label>
            <Input
              id="fi-amount"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {showCop && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                <span>Equivale a</span>
                <span className="tabular-nums font-medium text-foreground">
                  {fmtCop(copAmount)} COP
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fi-desc">Descripción (opcional)</Label>
            <Input
              id="fi-desc"
              type="text"
              placeholder={mode === "ingreso" ? "Depósito" : "Retiro"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {parsed > 0 && (
            <div className="rounded-xl bg-muted px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nuevo balance</span>
              <div className="text-right">
                <div className={cn("text-base font-bold tabular-nums", newBalance < 0 && "text-red-500")}>
                  {formatMoney(Math.max(0, newBalance), account.currency)}
                </div>
                {showCop && (
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {fmtCop(Math.max(0, newBalance) * (usdToCop as number))} COP
                  </div>
                )}
              </div>
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
