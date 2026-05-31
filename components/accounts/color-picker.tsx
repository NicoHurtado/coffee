"use client";
import { ACCOUNT_COLORS, cardStyle, type AccountColor } from "@/lib/finance/colors";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
}: {
  value?: AccountColor;
  onChange: (c: AccountColor) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {ACCOUNT_COLORS.map((c) => {
        const s = cardStyle(c.key);
        const active = value === c.key;
        const isLight = c.key === "silver";
        return (
          <button
            key={c.key}
            type="button"
            aria-label={c.label}
            title={c.label}
            onClick={() => onChange(c.key)}
            className={cn(
              "size-10 rounded-full flex items-center justify-center transition border-2",
              active ? "ring-2 ring-offset-2 ring-foreground scale-110" : "border-transparent",
            )}
            style={{ background: s.background, borderColor: s.border }}
          >
            {active && (
              <Check className={cn("size-4", isLight ? "text-zinc-900" : "text-white")} />
            )}
          </button>
        );
      })}
    </div>
  );
}
