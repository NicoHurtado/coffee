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
      <span className="hidden md:block text-[12px] font-medium tracking-[-0.005em] text-muted-foreground tabular-nums">
        Panorama general · {today}
      </span>
      <h1 className="text-[28px] md:text-[32px] font-semibold tracking-[-0.035em]">
        {name ? `Hola, ${name}` : "Hola"}
      </h1>
    </div>
  );
}
