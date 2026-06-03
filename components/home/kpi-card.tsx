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
  const pillClass =
    tone === "up"
      ? "text-primary bg-primary/10"
      : tone === "down"
        ? "text-destructive bg-destructive/10"
        : "text-muted-foreground bg-muted";
  return (
    <div className="relative border bg-card p-4 flex flex-col gap-3 overflow-hidden">
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px",
          tone === "up" ? "bg-primary/50" : tone === "down" ? "bg-destructive/50" : "bg-border",
        )}
      />
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
        <div className="text-[11px] flex items-center gap-2 text-muted-foreground tabular-nums">
          {tone !== "neutral" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-semibold",
                pillClass,
              )}
            >
              {tone === "up" && <ArrowUp className="size-3" />}
              {tone === "down" && <ArrowDown className="size-3" />}
              {delta}
            </span>
          )}
          {tone === "neutral" && delta}
        </div>
      )}
    </div>
  );
}
