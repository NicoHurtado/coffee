"use client";
import { cn } from "@/lib/utils";

export function TypeToggle({
  value,
  onChange,
}: {
  value: "expense" | "income";
  onChange: (v: "expense" | "income") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted">
      <button
        type="button"
        onClick={() => onChange("expense")}
        className={cn(
          "py-2 rounded-md text-sm font-medium transition",
          value === "expense"
            ? "bg-red-500 text-white"
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
            ? "bg-emerald-500 text-white"
            : "text-muted-foreground",
        )}
      >
        Ingreso
      </button>
    </div>
  );
}
