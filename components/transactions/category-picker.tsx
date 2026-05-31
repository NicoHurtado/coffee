"use client";
import { useCategoriesStore } from "@/lib/store/categories";
import { getCategoryIcon } from "@/lib/finance/categories";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function CategoryPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (c: string) => void;
}) {
  const categories = useCategoriesStore((s) => s.categories);
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">Seleccionar categoría</div>
      <ScrollArea className="w-full whitespace-nowrap -mx-4">
        <div className="flex gap-2 pb-2 px-4">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const active = cat.name === value;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onChange(cat.name)}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-16 p-2 rounded-lg border text-xs transition",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background hover:bg-accent",
                )}
              >
                <Icon className="size-5" />
                {cat.name}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
