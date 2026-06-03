"use client";
import { useSettingsStore } from "@/lib/store/settings";

export function Greeting() {
  const name = useSettingsStore((s) => s.userName);
  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="flex flex-col gap-1">
      <span className="hidden md:block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
        Panorama general · {today}
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">
        {name ? `Hola, ${name}` : "Hola"}
      </h1>
    </div>
  );
}
