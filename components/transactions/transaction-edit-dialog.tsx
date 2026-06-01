"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useTransactionsStore } from "@/lib/store/transactions";
import { useAccountsStore } from "@/lib/store/accounts";
import { useCategoriesStore } from "@/lib/store/categories";
import { type Transaction, type TransactionKind } from "@/lib/types";

export function TransactionEditDialog({
  tx,
  open,
  onOpenChange,
}: {
  tx: Transaction | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const update = useTransactionsStore((s) => s.update);
  const remove = useTransactionsStore((s) => s.remove);
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const categories = useCategoriesStore((s) => s.categories);

  const [kind, setKind] = useState<TransactionKind>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Otro");
  const [accountId, setAccountId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!tx) return;
    setKind(tx.kind);
    setAmount(String(tx.amount));
    setCategory(tx.category);
    setAccountId(tx.accountId);
    setDescription(tx.description ?? "");
    // local datetime input value
    const d = new Date(tx.occurredAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    setOccurredAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    );
  }, [tx]);

  if (!tx) return null;

  const amountNum = parseFloat(amount || "0");
  const canSave = amountNum > 0 && !!accountId && !!category;

  const save = async () => {
    if (!canSave) return;
    await update(tx.id, {
      kind,
      amount: amountNum,
      category,
      accountId,
      description: description || undefined,
      occurredAt: new Date(occurredAt).toISOString(),
    });
    toast.success("Transacción actualizada");
    onOpenChange(false);
  };

  const onDelete = async () => {
    await remove(tx.id);
    toast.success("Transacción eliminada");
    setConfirmDelete(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle>Editar transacción</DialogTitle>
          <DialogDescription className="sr-only">
            Edita los campos de la transacción y guarda los cambios.
          </DialogDescription>

          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted">
              <button
                type="button"
                onClick={() => setKind("expense")}
                className={
                  "py-1.5 rounded-md text-sm font-medium transition " +
                  (kind === "expense" ? "bg-red-500 text-white" : "text-muted-foreground")
                }
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setKind("income")}
                className={
                  "py-1.5 rounded-md text-sm font-medium transition " +
                  (kind === "income" ? "bg-emerald-500 text-white" : "text-muted-foreground")
                }
              >
                Ingreso
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amt">Monto</Label>
              <Input
                id="amt"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cuenta</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Descripción</Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dt">Fecha y hora</Label>
              <Input
                id="dt"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between gap-2 sm:gap-2">
            <Button
              variant="ghost"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4 mr-1" /> Eliminar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button disabled={!canSave} onClick={save}>
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Eliminar transacción</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer.
          </DialogDescription>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
