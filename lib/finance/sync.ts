import type { Transaction } from "@/lib/types";

/** Descripción con la que la integración de IBKR registra sus ajustes de balance. */
export const SYNC_DESCRIPTION = "Sincronización IBKR";

/**
 * Una transacción de sincronización con la API de Interactive Brokers.
 * Estos ajustes actualizan el balance de la cuenta de inversión, pero NO
 * deben aparecer en el historial ni en la actividad reciente como movimientos.
 */
export function isSyncTx(t: Transaction): boolean {
  return t.kind === "adjustment" && t.description === SYNC_DESCRIPTION;
}
