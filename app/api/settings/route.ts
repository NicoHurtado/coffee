import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import type { Currency } from "@/lib/types";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface SettingsDoc {
  userId: string;
  defaultCurrency: Currency;
  lastUsedAccountId?: string;
}

const DEFAULTS = {
  defaultCurrency: "USD" as Currency,
};

export async function GET() {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const db = await getDb();
  // The display name lives on the user doc (used for the greeting and card holder).
  const user = await db
    .collection<{ id: string; name?: string; username: string }>("users")
    .findOne({ id: uid }, { projection: { _id: 0, name: 1, username: 1 } });
  const settings = await db
    .collection<SettingsDoc>("settings")
    .findOne({ userId: uid }, { projection: { _id: 0, userId: 0 } });

  return NextResponse.json({
    userName: user?.name ?? user?.username ?? "",
    defaultCurrency: settings?.defaultCurrency ?? DEFAULTS.defaultCurrency,
    lastUsedAccountId: settings?.lastUsedAccountId,
  });
}

export async function PATCH(req: Request) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const patch = (await req.json()) as Partial<Omit<SettingsDoc, "userId">>;
  const db = await getDb();
  await db
    .collection<SettingsDoc>("settings")
    .updateOne(
      { userId: uid },
      { $set: patch, $setOnInsert: { userId: uid, ...DEFAULTS } },
      { upsert: true },
    );
  const doc = await db
    .collection<SettingsDoc>("settings")
    .findOne({ userId: uid }, { projection: { _id: 0, userId: 0 } });
  return NextResponse.json(doc ?? DEFAULTS);
}
