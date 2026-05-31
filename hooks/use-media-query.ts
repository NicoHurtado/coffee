"use client";
import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = (cb: () => void) => {
    const m = window.matchMedia(query);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 768px)");
}
