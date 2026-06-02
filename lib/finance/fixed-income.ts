import type { FixedIncomeAccount, Transaction } from "@/lib/types";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, (b.getTime() - a.getTime()) / DAY_MS);
}

/** Un flujo de capital con signo: aporta (+) o retira (−) en una fecha. */
interface Contribution {
  date: Date;
  amount: number;
}

/**
 * Flujos de capital de la cuenta, igual que una cajita de Nu:
 * - El balance inicial es un aporte en `startDate`.
 * - Depósitos (income, o transfer "in") suman; retiros (expense, o transfer
 *   "out") restan, en su fecha. Un transfer viejo sin direction es retiro.
 *
 * Cada aporte capitaliza de forma independiente desde su propia fecha: la plata
 * nueva crece desde el día que entra y el interés ya ganado sobre el capital
 * anterior se conserva (no se reinicia el reloj al depositar).
 */
function contributions(
  account: FixedIncomeAccount,
  txs: Transaction[],
): Contribution[] {
  const list: Contribution[] = [
    { date: new Date(account.startDate), amount: account.initialBalance },
  ];
  for (const t of txs) {
    if (t.accountId !== account.id) continue;
    const date = new Date(t.occurredAt);
    if (t.kind === "income") list.push({ date, amount: t.amount });
    else if (t.kind === "transfer")
      list.push({ date, amount: t.direction === "in" ? t.amount : -t.amount });
    else if (t.kind === "expense") list.push({ date, amount: -t.amount });
    // Los "adjustment" antiguos (snapshots absolutos) se ignoran: quedaron
    // reemplazados por flujos con signo.
  }
  return list;
}

/**
 * Balance actual con interés compuesto: cada aporte crece como
 * aporte * (1 + tasa)^(días desde su fecha / 365) y se suman todos.
 */
export function fixedIncomeBalance(
  account: FixedIncomeAccount,
  txs: Transaction[],
  now: Date = new Date(),
): number {
  const r = account.annualRate / 100;
  return contributions(account, txs).reduce((sum, c) => {
    const days = daysBetween(c.date, now);
    return sum + c.amount * Math.pow(1 + r, days / 365);
  }, 0);
}

/** Capital neto aportado, sin intereses: inicial + depósitos − retiros. */
export function netContributions(
  account: FixedIncomeAccount,
  txs: Transaction[],
): number {
  return contributions(account, txs).reduce((sum, c) => sum + c.amount, 0);
}

/** Rendimiento acumulado desde la creación: balance actual − capital aportado. */
export function accruedYield(
  account: FixedIncomeAccount,
  txs: Transaction[],
  now: Date = new Date(),
): number {
  return fixedIncomeBalance(account, txs, now) - netContributions(account, txs);
}

export function daysToMaturity(
  account: FixedIncomeAccount,
  now: Date = new Date(),
): number | null {
  if (!account.maturityDate) return null;
  const mat = new Date(account.maturityDate);
  return Math.max(0, Math.ceil(daysBetween(now, mat)));
}
