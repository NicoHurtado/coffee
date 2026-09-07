"use client";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "neutral",
  valueTone = "neutral",
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  tone?: "up" | "down" | "neutral";
  valueTone?: "up" | "down" | "neutral";
}) {
  const valueColor =
    valueTone === "up"
      ? "text-primary"
      : valueTone === "down"
        ? "text-destructive"
        : "text-foreground";
  const deltaColor =
    tone === "up" ? "text-primary" : tone === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="surface rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium tracking-[-0.01em] text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
      </div>
      <div className={cn("text-[1.75rem] font-semibold tabular-nums leading-none tracking-[-0.03em]", valueColor)}>
        {value}
      </div>
      {delta && (
        <div className={cn("text-[12px] flex items-center gap-1 tabular-nums font-medium", deltaColor)}>
          {tone === "up" && <ArrowUp className="size-3" />}
          {tone === "down" && <ArrowDown className="size-3" />}
          {delta}
        </div>
      )}
    </div>
  );
}
