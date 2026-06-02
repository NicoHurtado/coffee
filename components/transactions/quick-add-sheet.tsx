"use client";
import { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/lib/store/ui";
import { useAccountsStore } from "@/lib/store/accounts";
import { useTransactionsStore } from "@/lib/store/transactions";
import { useSettingsStore } from "@/lib/store/settings";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TypeToggle } from "./type-toggle";
import { AmountDisplay } from "./amount-display";
import { CategoryPicker } from "./category-picker";
import { NumericKeypad } from "./numeric-keypad";
import { AccountPicker } from "./account-picker";
import { type TransactionKind } from "@/lib/types";
import { useCategoriesStore } from "@/lib/store/categories";
import { getCategoryIcon } from "@/lib/finance/categories";
import { cn } from "@/lib/utils";

function applyKey(current: string, key: string): string {
  if (key === "back") return current.length <= 1 ? "" : current.slice(0, -1);
  if (key === ".") {
    if (current.includes(".")) return current;
    return current === "" ? "0." : current + ".";
  }
  // digit
  if (current === "0") return key;
  if (current.includes(".")) {
    const [, dec = ""] = current.split(".");
    if (dec.length >= 2) return current;
  }
  return current + key;
}

function QuickAddBody({
  onClose,
  variant,
}: {
  onClose: () => void;
  variant: "mobile" | "desktop";
}) {
  const { prefill } = useUIStore();
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const addTx = useTransactionsStore((s) => s.add);
  const { lastUsedAccountId, setLastUsedAccount, defaultCurrency } = useSettingsStore();

  const [kind, setKind] = useState<TransactionKind>(prefill.kind === "income" ? "income" : "expense");
  const [amount, setAmount] = useState("");
  const categories = useCategoriesStore((s) => s.categories);
  const [category, setCategory] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>(
    prefill.accountId ?? lastUsedAccountId ?? accounts[0]?.id,
  );
  const [destinationId, setDestinationId] = useState<string | undefined>();
  const [description, setDescription] = useState("");

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus amount on desktop open
  useEffect(() => {
    if (variant === "desktop" && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [variant]);

  const isTransfer = kind === "transfer";
  const amountNum = parseFloat(amount || "0");
  const canConfirm = isTransfer
    ? amountNum > 0 && !!accountId && !!destinationId && accountId !== destinationId
    : amountNum > 0 && !!accountId && !!category;

  const submit = () => {
    if (!canConfirm || !accountId) return;
    const now = new Date().toISOString();

    if (isTransfer) {
      if (!destinationId || accountId === destinationId) return;
      const src = accounts.find((a) => a.id === accountId);
      const dst = accounts.find((a) => a.id === destinationId);
      const pairId = `pair-${Date.now()}`;
      // Salida del origen
      addTx({
        accountId,
        kind: "transfer",
        direction: "out",
        amount: amountNum,
        category: "Traslado",
        description: description || (dst ? `Traslado a ${dst.name}` : undefined),
        occurredAt: now,
        transferPairId: pairId,
      });
      // Entrada al destino (no cuenta como ingreso)
      addTx({
        accountId: destinationId,
        kind: "transfer",
        direction: "in",
        amount: amountNum,
        category: "Traslado",
        description: description || (src ? `Traslado desde ${src.name}` : undefined),
        occurredAt: now,
        transferPairId: pairId,
      });
      setLastUsedAccount(accountId);
      toast.success("Traslado registrado");
      onClose();
      return;
    }

    if (!category) return;
    addTx({
      accountId,
      kind,
      amount: amountNum,
      category,
      description: description || undefined,
      occurredAt: now,
    });
    setLastUsedAccount(accountId);
    toast.success(kind === "income" ? "Ingreso registrado" : "Gasto registrado");
    onClose();
  };

  const onKeyDownGlobal = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canConfirm) {
      e.preventDefault();
      submit();
    }
  };

  // ───────── DESKTOP COMPACT FORM ─────────
  if (variant === "desktop") {
    return (
      <div className="flex flex-col p-6 gap-4 w-full" onKeyDown={onKeyDownGlobal}>
        <h2 className="text-lg font-semibold">Nueva transacción</h2>

        <TypeToggle value={kind === "income" || kind === "transfer" ? kind : "expense"} onChange={setKind} />

        <div className="space-y-1.5">
          <Label htmlFor="qa-amount-desktop">Monto</Label>
          <Input
            id="qa-amount-desktop"
            ref={amountInputRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={cn(
              "text-xl font-bold h-11 tabular-nums w-full",
              isTransfer ? "text-foreground" : kind === "income" ? "text-emerald-600" : "text-red-500",
            )}
          />
        </div>

        {isTransfer ? (
          <>
            <div className="space-y-1.5">
              <Label>Origen</Label>
              <AccountPicker value={accountId} onChange={setAccountId} />
            </div>
            <div className="space-y-1.5">
              <Label>Destino</Label>
              <AccountPicker value={destinationId} onChange={setDestinationId} />
              {accountId && destinationId && accountId === destinationId && (
                <p className="text-xs text-red-500">El origen y el destino deben ser distintos.</p>
              )}
            </div>
          </>
        ) : (
        <>
        <div className="space-y-1.5">
          <Label>Cuenta</Label>
          <AccountPicker value={accountId} onChange={setAccountId} />
        </div>

        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const active = cat.name === category;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg border text-xs font-medium transition",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background hover:bg-accent",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="qa-desc-desktop">Descripción</Label>
          <Input
            id="qa-desc-desktop"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-mono">Enter</kbd>{" "}
            para registrar
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={!canConfirm} onClick={submit}>
              Registrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ───────── MOBILE LAYOUT (unchanged) ─────────
  return (
    <div
      className="mx-auto flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto p-4"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="size-9 rounded-md hover:bg-accent flex items-center justify-center"
        >
          <X className="size-5" />
        </button>
      </div>

      <TypeToggle value={kind === "income" || kind === "transfer" ? kind : "expense"} onChange={setKind} />

      <AmountDisplay
        value={amount}
        currency={defaultCurrency}
        tone={isTransfer ? "income" : kind === "income" ? "income" : "expense"}
      />

      {isTransfer ? (
        <>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Origen</div>
            <AccountPicker value={accountId} onChange={setAccountId} />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Destino</div>
            <AccountPicker value={destinationId} onChange={setDestinationId} />
            {accountId && destinationId && accountId === destinationId && (
              <p className="text-xs text-red-500">El origen y el destino deben ser distintos.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <CategoryPicker value={category} onChange={setCategory} />

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Cuenta</div>
            <AccountPicker value={accountId} onChange={setAccountId} />
          </div>
        </>
      )}

      <Input
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <NumericKeypad onPress={(k) => setAmount((cur) => applyKey(cur, k))} />

      <Button disabled={!canConfirm} className="w-full h-12 text-base" onClick={submit}>
        Confirmar
      </Button>
    </div>
  );
}

export function QuickAddPanel() {
  const { quickAddOpen, closeQuickAdd, prefill } = useUIStore();
  // Touch devices (phones AND tablets like iPad) get the numeric keypad layout.
  // Only true pointer/mouse devices get the compact form with a native input.
  const isDesktop = useMediaQuery("(min-width: 768px) and (pointer: fine)");
  const bodyKey = `${quickAddOpen ? "open" : "closed"}-${prefill.accountId ?? ""}-${prefill.kind ?? ""}`;
  if (isDesktop) {
    return (
      <Dialog open={quickAddOpen} onOpenChange={(o) => !o && closeQuickAdd()}>
        <DialogContent className="w-[min(560px,calc(100vw-2rem))] max-w-none p-0 overflow-hidden">
          <DialogTitle className="sr-only">Nueva transacción</DialogTitle>
          <QuickAddBody key={bodyKey} onClose={closeQuickAdd} variant="desktop" />
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={quickAddOpen} onOpenChange={(o) => !o && closeQuickAdd()}>
      <SheetContent side="bottom" showCloseButton={false} className="p-0 h-[90vh]">
        <SheetTitle className="sr-only">Nueva transacción</SheetTitle>
        <QuickAddBody key={bodyKey} onClose={closeQuickAdd} variant="mobile" />
      </SheetContent>
    </Sheet>
  );
}
