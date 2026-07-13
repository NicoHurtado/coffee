import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/mongodb";
import { lastDayOfMonth } from "@/lib/finance/subscriptions";
import type { Subscription, Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

type SubscriptionDoc = Subscription & { userId: string };

/**
 * Daily job (see vercel.json) that turns due subscriptions into real expense
 * transactions. A subscription is due today when its billingDay matches the
 * day of month (clamped to the last day for shorter months, e.g. 31 → 28/29
 * Feb) and it hasn't already been charged this calendar month — the
 * lastChargedMonth guard makes re-running the job the same day a no-op, so a
 * retry or duplicate trigger can never double-charge.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Colombia-local calendar date, independent of the server's UTC clock.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const day = Number(parts.find((p) => p.type === "day")!.value);
  const currentMonthKey = `${year}-${String(month).padStart(2, "0")}`;
  const isLastDayOfMonth = day === lastDayOfMonth(year, month);

  const db = await getDb();
  const due = await db
    .collection<SubscriptionDoc>("subscriptions")
    .find({
      active: true,
      lastChargedMonth: { $ne: currentMonthKey },
      $or: [
        { billingDay: day },
        ...(isLastDayOfMonth ? [{ billingDay: { $gt: day } }] : []),
      ],
    })
    .toArray();

  let charged = 0;
  const occurredAt = new Date().toISOString();
  for (const sub of due) {
    const tx: Transaction & { userId: string } = {
      id: uuid(),
      accountId: sub.accountId,
      kind: "expense",
      amount: sub.amount,
      category: sub.category,
      description: sub.name,
      occurredAt,
      userId: sub.userId,
    };
    await db.collection<Transaction>("transactions").insertOne(tx);
    await db
      .collection<SubscriptionDoc>("subscriptions")
      .updateOne({ id: sub.id }, { $set: { lastChargedMonth: currentMonthKey } });
    charged++;
  }

  return NextResponse.json({ ok: true, charged, date: `${currentMonthKey}-${String(day).padStart(2, "0")}` });
}
