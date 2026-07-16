"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTransactionsStore } from "@/lib/store/transactions";
import { formatMoney } from "@/lib/finance/format";
import type { Account } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  account: Account;
  currentBalance: number;
}

/**
 * Ajuste manual rápido del balance: el usuario escribe el balance real de su
 * banco y se registra un único movimiento por la diferencia, sin tocar el
 * balance inicial ni tener que cuadrar movimientos a mano.
 */
export function AdjustBalanceDialog({ open, onOpenChange, account, currentBalance }: Props) {
  const addTx = useTransactionsStore((s) => s.add);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const target = parseFloat(value);
  const hasValue = value !== "" && !Number.isNaN(target);
  const delta = hasValue ? target - currentBalance : 0;

  const confirm = async () => {
    if (!hasValue || delta === 0) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      if (account.type === "investment") {
        // Inversión: el balance es el último "adjustment" absoluto.
        await addTx({
          accountId: account.id,
          kind: "adjustment",
          amount: target,
          category: "Ajuste",
          description: "Ajuste manual de balance",
          occurredAt: now,
        });
      } else if (account.type === "credit") {
        // Crédito: el balance es deuda. Más deuda = gasto, menos deuda = ingreso.
        await addTx({
          accountId: account.id,
          kind: delta > 0 ? "expense" : "income",
          amount: Math.abs(delta),
          category: "Ajuste",
          description: "Ajuste manual de balance",
          occurredAt: now,
        });
      } else {
        // Débito y renta fija: la diferencia entra o sale como flujo.
        await addTx({
          accountId: account.id,
          kind: delta > 0 ? "income" : "expense",
          amount: Math.abs(delta),
          category: "Ajuste",
          description: "Ajuste manual de balance",
          occurredAt: now,
        });
      }
      toast.success("Balance ajustado");
      onOpenChange(false);
      setValue("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Ajustar balance</DialogTitle>
        <DialogDescription>
          Escribe el balance real de tu cuenta y se registra un movimiento de
          ajuste por la diferencia.
        </DialogDescription>

        <div className="space-y-4 pt-1">
          <div className="rounded-xl bg-muted px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {account.type === "credit" ? "Deuda actual" : "Balance actual"}
            </span>
            <span className="text-base font-bold tabular-nums">
              {formatMoney(currentBalance, account.currency)}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="real-balance">
              {account.type === "credit" ? "Deuda real" : "Balance real"}
            </Label>
            <Input
              id="real-balance"
              type="number"
              inputMode="decimal"
              placeholder={String(Math.round(currentBalance * 100) / 100)}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </div>

          {hasValue && (
            <div className="text-sm flex items-center justify-between px-1">
              <span className="text-muted-foreground">Diferencia</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  delta === 0 && "text-muted-foreground",
                  delta > 0 && (account.type === "credit" ? "text-destructive" : "text-primary"),
                  delta < 0 && (account.type === "credit" ? "text-primary" : "text-destructive"),
                )}
              >
                {delta > 0 ? "+" : delta < 0 ? "-" : ""}
                {formatMoney(Math.abs(delta), account.currency)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!hasValue || delta === 0 || loading} onClick={confirm}>
            Ajustar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
