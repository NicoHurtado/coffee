import type { Transaction } from "@/lib/types";

/**
 * Un traslado son dos transacciones (salida + entrada) ligadas por
 * transferPairId. En vistas que mezclan cuentas (Actividad Reciente global,
 * Historial "Todas") eso se ve como un duplicado. Esta función deja una sola
 * fila por par, prefiriendo la pata de salida ("out") como representante.
 *
 * En vistas de una sola cuenta NO se debe usar: ahí cada cuenta solo tiene su
 * propia pata, que sí debe mostrarse.
 */
export function collapseTransferPairs(txs: Transaction[]): Transaction[] {
  const seen = new Set<string>();
  const out: Transaction[] = [];
  // Primera pasada: quedarnos con la pata "out" de cada par.
  for (const t of txs) {
    if (t.kind === "transfer" && t.transferPairId) {
      if (t.direction === "in") continue; // se representa con la pata "out"
      if (seen.has(t.transferPairId)) continue;
      seen.add(t.transferPairId);
    }
    out.push(t);
  }
  // Segunda pasada: pares cuya pata "out" no está en este conjunto
  // (p.ej. filtrada por periodo) — rescatar la "in" para no perderlos.
  for (const t of txs) {
    if (
      t.kind === "transfer" &&
      t.transferPairId &&
      t.direction === "in" &&
      !seen.has(t.transferPairId)
    ) {
      seen.add(t.transferPairId);
      out.push(t);
    }
  }
  // Mantener el orden original (por fecha) tras los rescates.
  return out.sort((a, b) => txs.indexOf(a) - txs.indexOf(b));
}
