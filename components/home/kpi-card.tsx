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
    <div className="bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
          {label}
        </span>
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
      </div>
      <div className={cn("text-[1.7rem] font-semibold tabular-nums leading-none", valueColor)}>
        {value}
      </div>
      {delta && (
        <div className={cn("text-[11px] flex items-center gap-1 tabular-nums", deltaColor)}>
          {tone === "up" && <ArrowUp className="size-3" />}
          {tone === "down" && <ArrowDown className="size-3" />}
          {delta}
        </div>
      )}
    </div>
  );
}
