"use client";
import type { CardNetwork } from "@/lib/types";
import { CardBrandLogo } from "./card-brand";
import { cn } from "@/lib/utils";

const NETWORKS: { key: CardNetwork; label: string }[] = [
  { key: "visa", label: "Visa" },
  { key: "mastercard", label: "Mastercard" },
  { key: "amex", label: "Amex" },
  { key: "other", label: "Otra" },
];

export function CardNetworkPicker({
  value,
  onChange,
}: {
  value?: CardNetwork;
  onChange: (n: CardNetwork) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {NETWORKS.map((n) => {
        const active = value === n.key;
        return (
          <button
            key={n.key}
            type="button"
            onClick={() => onChange(n.key)}
            className={cn(
              "rounded-xl border h-16 flex flex-col items-center justify-center gap-1 transition",
              active
                ? "border-foreground ring-2 ring-foreground/20 bg-accent/30"
                : "hover:bg-accent",
            )}
          >
            <span className="text-foreground">
              <CardBrandLogo network={n.key} className="h-4 w-auto" />
            </span>
            <span className="text-[10px] text-muted-foreground">{n.label}</span>
          </button>
        );
      })}
    </div>
  );
}
