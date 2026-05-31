"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { TypeToggle } from "@/components/transactions/type-toggle";
import { AmountDisplay } from "@/components/transactions/amount-display";
import { CategoryPicker } from "@/components/transactions/category-picker";
import { AccountPicker } from "@/components/transactions/account-picker";
import { NumericKeypad } from "@/components/transactions/numeric-keypad";
import { cn } from "@/lib/utils";
import type { TransactionKind } from "@/lib/types";

function applyKey(current: string, key: string): string {
  if (key === "back") return current.length <= 1 ? "" : current.slice(0, -1);
  if (key === ".") {
    if (current.includes(".")) return current;
    return current === "" ? "0." : current + ".";
  }
  if (current === "0") return key;
  if (current.includes(".")) {
    const [, dec = ""] = current.split(".");
    if (dec.length >= 2) return current;
  }
  return current + key;
}

export default function QuickPage() {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const addTx = useTransactionsStore((s) => s.add);
  const { lastUsedAccountId, setLastUsedAccount, defaultCurrency } = useSettingsStore();

  const [kind, setKind] = useState<TransactionKind>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>(
    lastUsedAccountId ?? accounts[0]?.id,
  );
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);

  const amountNum = parseFloat(amount || "0");
  const canConfirm = amountNum > 0 && !!accountId && !!category;

  const submit = () => {
    if (!canConfirm || !accountId || !category) return;
    addTx({
      accountId,
      kind,
      amount: amountNum,
      category,
      description: description || undefined,
      occurredAt: new Date().toISOString(),
    });
    setLastUsedAccount(accountId);
    setDone(true);
  };

  const reset = () => {
    setAmount("");
    setCategory(undefined);
    setDescription("");
    setDone(false);
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-16 text-emerald-500" />
          <h1 className="text-2xl font-bold">
            {kind === "income" ? "Ingreso registrado" : "Gasto registrado"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {category} · {defaultCurrency} {amountNum.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col w-full max-w-xs gap-3">
          <Button size="lg" onClick={reset} className="w-full">
            Agregar otra
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full">
            <Link href="/">Ir a Coffee</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-[env(safe-area-inset-top,24px)]">
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <span className="text-sm font-semibold">Nueva transacción</span>
        <Link href="/" className="text-xs text-muted-foreground">
          Cancelar
        </Link>
      </div>

      <TypeToggle value={kind === "income" ? "income" : "expense"} onChange={setKind} />

      <AmountDisplay value={amount} currency={defaultCurrency} tone={kind === "income" ? "income" : "expense"} />

      <CategoryPicker value={category} onChange={setCategory} />

      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">Cuenta</div>
        <AccountPicker value={accountId} onChange={setAccountId} />
      </div>

      <Input
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="text-sm h-8"
      />

      <NumericKeypad onPress={(k) => setAmount((v) => applyKey(v, k))} />

      <Button
        disabled={!canConfirm}
        onClick={submit}
        className="w-full h-11 text-sm font-semibold"
      >
        {kind === "income" ? "Registrar ingreso" : "Registrar gasto"}
      </Button>
    </div>
    </div>
  );
}
