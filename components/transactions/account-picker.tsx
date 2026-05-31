"use client";
import { useMemo, useState, useEffect } from "react";
import { useAccountsStore } from "@/lib/store/accounts";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/lib/types";

const TYPE_LABEL: Record<AccountType, string> = {
  debit: "Débito",
  credit: "Crédito",
  fixed_income: "Renta Fija",
  investment: "Inversión",
};

const TYPE_ORDER: AccountType[] = ["debit", "credit", "fixed_income", "investment"];

export function AccountPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (id: string) => void;
}) {
  const accounts = useAccountsStore((s) => s.activeAccounts);

  // Derive initial type from selected account
  const initialType =
    accounts.find((a) => a.id === value)?.type ??
    (TYPE_ORDER.find((t) => accounts.some((a) => a.type === t)) as AccountType);

  const [type, setType] = useState<AccountType>(initialType);

  // If value changes externally and matches a different type, sync
  useEffect(() => {
    if (!value) return;
    const acc = accounts.find((a) => a.id === value);
    if (acc && acc.type !== type) setType(acc.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const typesAvailable = useMemo(
    () => TYPE_ORDER.filter((t) => accounts.some((a) => a.type === t)),
    [accounts],
  );

  const accountsOfType = useMemo(
    () => accounts.filter((a) => a.type === type),
    [accounts, type],
  );

  if (accounts.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2">Sin cuentas registradas.</div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {typesAvailable.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition",
              type === t
                ? "bg-foreground text-background border-foreground"
                : "bg-background hover:bg-accent",
            )}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {accountsOfType.map((a) => {
          const active = a.id === value;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(a.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background hover:bg-accent",
              )}
            >
              {a.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
