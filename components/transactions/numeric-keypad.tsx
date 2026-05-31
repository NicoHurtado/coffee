"use client";
import { Delete } from "lucide-react";

export function NumericKeypad({
  onPress,
}: {
  onPress: (key: string) => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPress(k)}
          className="h-14 rounded-lg bg-muted hover:bg-accent text-xl font-medium flex items-center justify-center active:scale-95 transition"
        >
          {k === "back" ? <Delete className="size-5" /> : k}
        </button>
      ))}
    </div>
  );
}
