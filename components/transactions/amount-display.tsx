"use client";
import type { Currency } from "@/lib/types";

const SYMBOL: Record<Currency, string> = { USD: "$", COP: "$" };

export function AmountDisplay({
  value,
  currency = "USD",
  tone = "neutral",
}: {
  value: string; // raw input string
  currency?: Currency;
  tone?: "expense" | "income" | "neutral";
}) {
  const display = value === "" ? "0" : value;
  const color =
    tone === "expense"
      ? "text-red-500"
      : tone === "income"
        ? "text-emerald-500"
        : "text-foreground";
  return (
    <div className={`text-center text-5xl font-semibold tabular-nums ${color}`}>
      <span className="text-3xl mr-1 align-top">{SYMBOL[currency]}</span>
      {display}
    </div>
  );
}
