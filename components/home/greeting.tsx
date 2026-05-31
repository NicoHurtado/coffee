"use client";
import { useSettingsStore } from "@/lib/store/settings";

export function Greeting() {
  const name = useSettingsStore((s) => s.userName);
  return <h1 className="text-2xl font-semibold">{name ? `Hola, ${name}!` : "Hola!"}</h1>;
}
