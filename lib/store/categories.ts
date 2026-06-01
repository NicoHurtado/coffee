"use client";
import { create } from "zustand";

export interface CategoryDoc {
  name: string;
  color: string;
}

interface State {
  categories: CategoryDoc[];
  loaded: boolean;
  isHydrating: boolean;
  seed: (categories: CategoryDoc[]) => void;
  hydrate: () => Promise<void>;
}

export const useCategoriesStore = create<State>()((set, get) => ({
  categories: [],
  loaded: false,
  isHydrating: false,
  seed: (categories) => {
    // Server-prefetched data: skip if the client already loaded fresher state.
    if (get().loaded) return;
    set({ categories, loaded: true });
  },
  hydrate: async () => {
    const { loaded, isHydrating } = get();
    if (loaded || isHydrating) return;
    set({ isHydrating: true });
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const categories: CategoryDoc[] = await res.json();
      set({ categories, loaded: true, isHydrating: false });
    } catch {
      set({ isHydrating: false });
    }
  },
}));
