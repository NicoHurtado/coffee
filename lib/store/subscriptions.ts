"use client"
import { create } from "zustand"
import { v4 as uuid } from "uuid"
import { toast } from "sonner"
import type { Subscription } from "@/lib/types"

interface State {
  subscriptions: Subscription[]
  loaded: boolean
  isHydrating: boolean
  seed: (subscriptions: Subscription[]) => void
  hydrate: () => Promise<void>
  refresh: () => Promise<void>
  add: (
    data: Omit<Subscription, "id" | "createdAt" | "active">
  ) => Promise<Subscription>
  update: (id: string, patch: Partial<Subscription>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useSubscriptionsStore = create<State>()((set, get) => ({
  subscriptions: [],
  loaded: false,
  isHydrating: false,
  seed: (subscriptions) => {
    // Server-prefetched data: skip if the client already loaded fresher state.
    if (get().loaded) return
    set({ subscriptions, loaded: true })
  },
  hydrate: async () => {
    const { loaded, isHydrating } = get()
    if (loaded || isHydrating) return
    set({ isHydrating: true })
    try {
      const res = await fetch("/api/subscriptions", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const subscriptions: Subscription[] = await res.json()
      set({ subscriptions, loaded: true, isHydrating: false })
    } catch {
      // DB unreachable: don't crash the app — leave state empty and allow a retry.
      set({ isHydrating: false })
    }
  },
  refresh: async () => {
    set({ loaded: false, isHydrating: false })
    await get().hydrate()
  },
  add: async (data) => {
    const prev = get().subscriptions
    const sub: Subscription = {
      ...data,
      id: uuid(),
      active: true,
      createdAt: new Date().toISOString(),
    }
    set({ subscriptions: [sub, ...prev] })
    void fetch("/api/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sub),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      })
      .catch(() => {
        set((state) => ({
          subscriptions: state.subscriptions.filter(
            (item) => item.id !== sub.id
          ),
        }))
        toast.error(
          "No se pudo guardar la suscripción. Revisa tu conexión e inténtalo de nuevo."
        )
      })
    return sub
  },
  update: async (id, patch) => {
    const prev = get().subscriptions
    const previous = prev.find((item) => item.id === id)
    let optimistic: Subscription | undefined
    const subscriptions = prev.map((s) => {
      if (s.id !== id) return s
      optimistic = { ...s, ...patch }
      return optimistic
    })
    set({ subscriptions })
    void fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      })
      .catch(() => {
        if (!previous) return
        set((state) => ({
          subscriptions: state.subscriptions.map((item) =>
            item === optimistic ? previous : item
          ),
        }))
        toast.error(
          "No se pudo actualizar la suscripción. Revisa tu conexión e inténtalo de nuevo."
        )
      })
  },
  remove: async (id) => {
    const prev = get().subscriptions
    const removed = prev.find((item) => item.id === id)
    set({ subscriptions: prev.filter((s) => s.id !== id) })
    void fetch(`/api/subscriptions/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      })
      .catch(() => {
        if (!removed) return
        set((state) =>
          state.subscriptions.some((item) => item.id === id)
            ? state
            : { subscriptions: [removed, ...state.subscriptions] }
        )
        toast.error(
          "No se pudo eliminar la suscripción. Revisa tu conexión e inténtalo de nuevo."
        )
      })
  },
}))
