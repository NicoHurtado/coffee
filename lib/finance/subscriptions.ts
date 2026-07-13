import type { Subscription } from "@/lib/types";

/** Last valid day of a given year/month (month is 1-indexed). */
export function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Clamp a billing day to the last day of the month it falls in (e.g. 31 → 28/29 in Feb). */
export function clampBillingDay(year: number, month: number, billingDay: number): number {
  return Math.min(billingDay, lastDayOfMonth(year, month));
}

/** Next occurrence of a subscription's billing date, on or after `from`. */
export function nextChargeDate(billingDay: number, from = new Date()): Date {
  const year = from.getFullYear();
  const month = from.getMonth() + 1;
  const day = clampBillingDay(year, month, billingDay);
  const thisMonth = new Date(year, month - 1, day);
  if (thisMonth >= new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    return thisMonth;
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return new Date(nextYear, nextMonth - 1, clampBillingDay(nextYear, nextMonth, billingDay));
}

export function monthlyTotal(subscriptions: Subscription[], currency: Subscription["currency"]): number {
  return subscriptions
    .filter((s) => s.active && s.currency === currency)
    .reduce((sum, s) => sum + s.amount, 0);
}
