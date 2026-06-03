"use client";
import { cn } from "@/lib/utils";

type ToggleValue = "expense" | "income" | "transfer";

export function TypeToggle({
  value,
  onChange,
}: {
  value: ToggleValue;
  onChange: (v: ToggleValue) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-muted">
      <button
        type="button"
        onClick={() => onChange("expense")}
        className={cn(
          "py-2 rounded-md text-sm font-medium transition",
          value === "expense"
            ? "bg-destructive text-white"
            : "text-muted-foreground",
        )}
      >
        Gasto
      </button>
      <button
        type="button"
        onClick={() => onChange("income")}
        className={cn(
          "py-2 rounded-md text-sm font-medium transition",
          value === "income"
            ? "bg-primary text-white"
            : "text-muted-foreground",
        )}
      >
        Ingreso
      </button>
      <button
        type="button"
        onClick={() => onChange("transfer")}
        className={cn(
          "py-2 rounded-md text-sm font-medium transition",
          value === "transfer"
            ? "bg-foreground text-background"
            : "text-muted-foreground",
        )}
      >
        Traslado
      </button>
    </div>
  );
}
