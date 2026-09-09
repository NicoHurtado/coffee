"use client";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccountsStore } from "@/lib/store/accounts";
import { useCategoriesStore } from "@/lib/store/categories";
import { useSubscriptionsStore } from "@/lib/store/subscriptions";
import type { Currency, Subscription } from "@/lib/types";

interface Props {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function SubscriptionDialog(props: Props) {
  return (
    <SubscriptionDialogForm
      key={`${props.open}-${props.subscription?.id ?? "new"}`}
      {...props}
    />
  );
}

function SubscriptionDialogForm({ subscription, open, onOpenChange }: Props) {
  const accounts = useAccountsStore((s) => s.activeAccounts);
  const categories = useCategoriesStore((s) => s.categories);
  const add = useSubscriptionsStore((s) => s.add);
  const update = useSubscriptionsStore((s) => s.update);
  const remove = useSubscriptionsStore((s) => s.remove);

  const isEdit = !!subscription;

  const [name, setName] = useState(subscription?.name ?? "");
  const [amount, setAmount] = useState(subscription ? String(subscription.amount) : "");
  const [currency, setCurrency] = useState<Currency>(subscription?.currency ?? "COP");
  const [category, setCategory] = useState(subscription?.category ?? "Otro");
  const [accountId, setAccountId] = useState(subscription?.accountId ?? accounts[0]?.id ?? "");
  const [billingDay, setBillingDay] = useState(
    subscription ? String(subscription.billingDay) : "1",
  );
  const [active, setActive] = useState(subscription?.active ?? true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const amountNum = parseFloat(amount || "0");
  const dayNum = parseInt(billingDay || "0", 10);
  const canSave = amountNum > 0 && !!accountId && !!category && dayNum >= 1 && dayNum <= 31;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit) {
        await update(subscription.id, {
          name,
          amount: amountNum,
          currency,
          category,
          accountId,
          billingDay: dayNum,
          active,
        });
        toast.success("Suscripción actualizada");
      } else {
        await add({
          name,
          amount: amountNum,
          currency,
          category,
          accountId,
          billingDay: dayNum,
        });
        toast.success("Suscripción añadida");
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!subscription) return;
    await remove(subscription.id);
    toast.success("Suscripción eliminada");
    setConfirmDelete(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{isEdit ? "Editar suscripción" : "Nueva suscripción"}</DialogTitle>
        <DialogDescription className="sr-only">
          Registra una suscripción recurrente para que se cobre automáticamente cada mes.
        </DialogDescription>

        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="sub-name">Nombre</Label>
            <Input
              id="sub-name"
              placeholder="Netflix, Spotify, iCloud..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-amount">Monto</Label>
              <Input
                id="sub-amount"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Label htmlFor="sub-day">Día de cobro (1-31)</Label>
            <Input
              id="sub-day"
              type="number"
              min={1}
              max={31}
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Si el mes es más corto (p. ej. febrero), se cobra el último día del mes.
            </p>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
              <Label htmlFor="sub-active" className="text-sm">Activa</Label>
              <Switch id="sub-active" checked={active} onCheckedChange={setActive} />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 sm:justify-between">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  Confirmar eliminar
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" /> Eliminar
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSave || saving} onClick={save}>
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
