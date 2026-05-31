"use client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAccountsStore } from "@/lib/store/accounts";
import { cn } from "@/lib/utils";
import type { Account, AccountType } from "@/lib/types";

interface Props {
  value: string | "all";
  onChange: (v: string | "all") => void;
  /** "bleed" = full-bleed scroll (mobile sticky bar). "wrap" = wrap within container (desktop sidebar). */
  variant?: "bleed" | "wrap";
}

const GROUPS: { type: AccountType; title: string }[] = [
  { type: "debit", title: "Débito" },
  { type: "credit", title: "Crédito" },
  { type: "fixed_income", title: "Renta Fija" },
  { type: "investment", title: "Inversiones" },
];

export function AccountPills({ value, onChange, variant = "bleed" }: Props) {
  const accounts = useAccountsStore((s) => s.activeAccounts);

  const Pill = ({ id, label }: { id: string | "all"; label: string }) => (
    <button
      key={id}
      type="button"
      onClick={() => onChange(id)}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs border whitespace-nowrap transition",
        value === id
          ? "bg-foreground text-background border-foreground"
          : "bg-background hover:bg-accent",
      )}
    >
      {label}
    </button>
  );

  if (variant === "wrap") {
    return (
      <div className="space-y-3">
        <Pill id="all" label="Todas" />
        {GROUPS.map((g) => {
          const list = accounts.filter((a: Account) => a.type === g.type);
          if (list.length === 0) return null;
          return (
            <div key={g.type} className="space-y-1.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {g.title}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {list.map((a) => (
                  <Pill key={a.id} id={a.id} label={a.name} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // bleed: flat horizontal scroll for mobile
  const flat: { id: string | "all"; label: string }[] = [
    { id: "all", label: "Todas" },
    ...accounts.map((a) => ({ id: a.id, label: a.name })),
  ];
  return (
    <ScrollArea className="w-screen relative left-1/2 -translate-x-1/2 whitespace-nowrap">
      <div className="flex gap-2 pb-2 pl-4 pr-8">
        {flat.map((it) => (
          <Pill key={it.id} id={it.id} label={it.label} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
