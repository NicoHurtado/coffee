"use client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store/ui";

export function AddTransactionButton({ className }: { className?: string }) {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  return (
    <Button onClick={() => openQuickAdd()} className={className}>
      <Plus className="size-4 mr-1" /> Nueva transacción
    </Button>
  );
}
