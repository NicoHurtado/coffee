"use client"

import { useId, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { useAccountsStore } from "@/lib/store/accounts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

export function HomeAccountsPicker() {
  const accounts = useAccountsStore((s) => s.activeAccounts)
  const setHomeVisibility = useAccountsStore((s) => s.setHomeVisibility)
  const [saving, setSaving] = useState(false)
  const id = useId()

  async function toggle(accountId: string, visible: boolean) {
    setSaving(true)
    try {
      await setHomeVisibility(accountId, visible)
    } catch {
      toast.error("No se pudo guardar la selección. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal aria-hidden="true" /> Elegir tarjetas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tarjetas en Inicio</DialogTitle>
          <DialogDescription>
            Elige las cuentas que quieres ver en la página principal, tanto en
            celular como en computador. En Cuentas seguirán apareciendo todas.
            Los saldos y totales no cambian.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[45dvh] overflow-y-auto" aria-busy={saving}>
          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aún no tienes cuentas.
            </p>
          )}
          {accounts.map((account) => (
            <label
              key={account.id}
              htmlFor={`${id}-${account.id}`}
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl px-2 py-3 hover:bg-muted/50"
            >
              <Checkbox
                id={`${id}-${account.id}`}
                checked={account.showOnHome !== false}
                disabled={saving}
                onCheckedChange={(checked) =>
                  void toggle(account.id, checked === true)
                }
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium break-words">
                  {account.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {account.institution} · {account.currency}
                  {"last4" in account && account.last4
                    ? ` · ${account.last4}`
                    : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <p
            role="status"
            className="mr-auto self-center text-xs text-muted-foreground"
          >
            {saving ? "Guardando…" : "Los cambios se guardan automáticamente."}
          </p>
          <DialogClose asChild>
            <Button>Listo</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
