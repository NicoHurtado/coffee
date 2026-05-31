"use client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAccountsStore } from "@/lib/store/accounts";
import { AccountCard } from "./account-card";

export function AccountsSlider() {
  const accounts = useAccountsStore((s) => s.activeAccounts);

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Crea tu primera cuenta para empezar.
      </div>
    );
  }
  return (
    <div className="relative w-screen left-1/2 -translate-x-1/2">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-3 pl-4 md:pl-8 pr-8">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="mx-4 md:mx-8" />
      </ScrollArea>
    </div>
  );
}
