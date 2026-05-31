"use client";
import { useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";

export interface PeriodRange {
  from: Date;
  to: Date;
  label: string;
}

export function defaultPeriod(): PeriodRange {
  const now = new Date();
  return {
    from: startOfMonth(now),
    to: endOfMonth(now),
    label: "Este mes",
  };
}

export function PeriodPicker({
  value,
  onChange,
}: {
  value: PeriodRange;
  onChange: (v: PeriodRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const now = new Date();

  const presets = [
    {
      label: "Esta semana",
      compute: () => ({
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
        label: "Esta semana",
      }),
    },
    {
      label: "Este mes",
      compute: () => ({
        from: startOfMonth(now),
        to: endOfMonth(now),
        label: "Este mes",
      }),
    },
    {
      label: "Mes pasado",
      compute: () => {
        const m = subMonths(now, 1);
        return {
          from: startOfMonth(m),
          to: endOfMonth(m),
          label: "Mes pasado",
        };
      },
    },
  ];

  const display = `${format(value.from, "d")} – ${format(value.to, "d MMM")}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarDays className="size-4" />
          {display}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        {!customOpen ? (
          <div className="flex flex-col">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(p.compute());
                  setOpen(false);
                }}
                className="px-3 py-2 text-sm text-left rounded-md hover:bg-accent"
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className="px-3 py-2 text-sm text-left rounded-md hover:bg-accent"
            >
              Rango personalizado
            </button>
          </div>
        ) : (
          <Calendar
            mode="range"
            selected={{ from: value.from, to: value.to }}
            onSelect={(r) => {
              if (r?.from && r?.to) {
                onChange({
                  from: r.from,
                  to: r.to,
                  label: `${format(r.from, "d MMM")} – ${format(r.to, "d MMM")}`,
                });
                setCustomOpen(false);
                setOpen(false);
              }
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
