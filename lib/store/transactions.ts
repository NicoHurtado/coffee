"use client";
import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import type { Transaction } from "@/lib/types";

const EMPTY_TXS: Transaction[] = [];

function buildIndex(txs: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const list = map.get(tx.accountId);
    if (list) {
      list.push(tx);
    } else {
      map.set(tx.accountId, [tx]);
    }
  }
  return map;
}

interface State {
  transactions: Transaction[];
  txsByAccountId: Map<string, Transaction[]>;
  loaded: boolean;
  isHydrating: boolean;
  seed: (transactions: Transaction[]) => void;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  add: (data: Omit<Transaction, "id">) => Promise<Transaction>;
  update: (id: string, patch: Partial<Transaction>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  forAccount: (accountId: string) => Transaction[];
}

export const useTransactionsStore = create<State>()((set, get) => ({
  transactions: [],
  txsByAccountId: new Map(),
  loaded: false,
  isHydrating: false,
  seed: (transactions) => {
    // Server-prefetched data: skip if the client already loaded fresher state.
    if (get().loaded) return;
    set({ transactions, txsByAccountId: buildIndex(transactions), loaded: true });
  },
  hydrate: async () => {
    const { loaded, isHydrating } = get();
    if (loaded || isHydrating) return;
    set({ isHydrating: true });
    try {
      const res = await fetch("/api/transactions", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const transactions: Transaction[] = await res.json();
      set({ transactions, txsByAccountId: buildIndex(transactions), loaded: true, isHydrating: false });
    } catch {
      // DB unreachable: don't crash the app — leave state empty and allow a retry.
      set({ isHydrating: false });
    }
  },
  refresh: async () => {
    set({ loaded: false, isHydrating: false });
    await get().hydrate();
  },
  add: async (data) => {
    // Optimistic: generate id client-side, update UI immediately, persist in background.
    const prev = get().transactions;
    const tx: Transaction = { ...data, id: uuid() } as Transaction;
    const transactions = [tx, ...prev];
    set({ transactions, txsByAccountId: buildIndex(transactions) });
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(tx),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // El guardado falló: revertir la inserción optimista. Si no, quedaría una
      // transacción "fantasma" visible en la sesión que desaparecería al
      // recargar (p. ej. al día siguiente) porque nunca llegó a la base de datos.
      set({ transactions: prev, txsByAccountId: buildIndex(prev) });
      toast.error("No se pudo guardar el movimiento. Revisa tu conexión e inténtalo de nuevo.");
    }
    return tx;
  },
  update: async (id, patch) => {
    const current = get().transactions;
    const target = current.find((t) => t.id === id);
    // Si es un traslado, el monto y la fecha deben permanecer iguales en ambas
    // patas para que origen y destino sigan cuadrando. La dirección de cada
    // pata NO se toca.
    const sibling =
      target?.kind === "transfer" && target.transferPairId
        ? current.find(
            (t) => t.transferPairId === target.transferPairId && t.id !== id,
          )
        : undefined;
    const siblingPatch: Partial<Transaction> = {};
    if (sibling) {
      if (patch.amount !== undefined) siblingPatch.amount = patch.amount;
      if (patch.occurredAt !== undefined) siblingPatch.occurredAt = patch.occurredAt;
    }
    const applySibling = sibling && Object.keys(siblingPatch).length > 0;

    const transactions = current.map((t) => {
      if (t.id === id) return { ...t, ...patch };
      if (applySibling && t.id === sibling!.id) return { ...t, ...siblingPatch };
      return t;
    });
    set({ transactions, txsByAccountId: buildIndex(transactions) });

    const patchReq = (txId: string, body: Partial<Transaction>) =>
      fetch(`/api/transactions/${txId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });

    try {
      const reqs = [patchReq(id, patch)];
      if (applySibling) reqs.push(patchReq(sibling!.id, siblingPatch));
      await Promise.all(reqs);
    } catch {
      // Alguna escritura falló: revertir al estado previo para no mostrar un
      // cambio que no se persistió y que desaparecería al recargar.
      set({ transactions: current, txsByAccountId: buildIndex(current) });
      toast.error("No se pudo actualizar el movimiento. Revisa tu conexión e inténtalo de nuevo.");
    }
  },
  remove: async (id) => {
    const current = get().transactions;
    const target = current.find((t) => t.id === id);
    // Un traslado son dos patas (out + in) ligadas por transferPairId.
    // Borrar una sola dejaría el movimiento cojo y "perdería" plata, así que
    // se borran ambas juntas.
    const idsToRemove =
      target?.kind === "transfer" && target.transferPairId
        ? current
            .filter((t) => t.transferPairId === target.transferPairId)
            .map((t) => t.id)
        : [id];
    const transactions = current.filter((t) => !idsToRemove.includes(t.id));
    set({ transactions, txsByAccountId: buildIndex(transactions) });
    try {
      await Promise.all(
        idsToRemove.map((rid) =>
          fetch(`/api/transactions/${rid}`, { method: "DELETE" }).then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
          }),
        ),
      );
    } catch {
      // El borrado falló en el servidor: restaurar para no ocultar un
      // movimiento que en realidad sigue existiendo en la base de datos.
      set({ transactions: current, txsByAccountId: buildIndex(current) });
      toast.error("No se pudo eliminar el movimiento. Revisa tu conexión e inténtalo de nuevo.");
    }
  },
  forAccount: (accountId) => get().txsByAccountId.get(accountId) ?? EMPTY_TXS,
}));
