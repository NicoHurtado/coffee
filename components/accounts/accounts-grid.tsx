"use client";
import { useAccountsStore } from "@/lib/store/accounts";
import { AccountCard } from "./account-card";

export function AccountsGrid() {
  const accounts = useAccountsStore((s) => s.activeAccounts);

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Aún no tienes cuentas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      {accounts.map((a) => (
        <div key={a.id} className="[&>a]:min-w-0 [&>a]:max-w-none [&>a]:w-full">
          <AccountCard account={a} />
        </div>
      ))}
    </div>
  );
}
