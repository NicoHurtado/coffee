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
  const deltaColor =
    tone === "up" ? "text-emerald-600" : tone === "down" ? "text-red-500" : "text-muted-foreground";
  const valueColor =
    valueTone === "up"
      ? "text-emerald-600"
      : valueTone === "down"
        ? "text-red-500"
        : "text-foreground";
  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {Icon && <Icon className="size-4" />}
      </div>
      <div className={cn("text-2xl font-bold tabular-nums", valueColor)}>{value}</div>
      {delta && (
        <div className={cn("text-xs flex items-center gap-1", deltaColor)}>
          {tone === "up" && <ArrowUp className="size-3" />}
          {tone === "down" && <ArrowDown className="size-3" />}
          {delta}
        </div>
      )}
    </div>
  );
}
