"use client";
import { CARD_PRESETS, type CardPreset } from "@/lib/finance/card-presets";
import { CardBrandLogo } from "./card-brand";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function CardPresetPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (preset: CardPreset | null) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "relative rounded-xl border h-20 flex flex-col items-center justify-center text-xs gap-1 transition",
            value == null
              ? "border-foreground ring-2 ring-foreground/20"
              : "border-dashed hover:bg-accent",
          )}
        >
          <span className="text-muted-foreground">Personalizado</span>
          <span className="text-[10px] text-muted-foreground">(color manual)</span>
        </button>

        {CARD_PRESETS.map((p) => {
          const active = value === p.id;
          const isLight = p.textTone === "light";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "relative rounded-xl border h-20 overflow-hidden p-2 text-left transition flex flex-col justify-between",
                isLight ? "text-white" : "text-zinc-900",
                active ? "ring-2 ring-foreground ring-offset-2" : "hover:scale-[1.02]",
              )}
              style={{ background: p.gradient, borderColor: p.border }}
            >
              <div className="text-[9px] uppercase tracking-wider opacity-80 truncate">
                {p.issuer}
              </div>
              <div className="flex items-end justify-between gap-2">
                <span className="text-xs font-semibold truncate">{p.label}</span>
                <span style={{ color: p.brandColor }} className="inline-flex shrink-0">
                  <CardBrandLogo network={p.network} className="h-3 w-auto" />
                </span>
              </div>
              {active && (
                <div className="absolute top-1 right-1 size-5 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="size-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
