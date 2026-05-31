import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import type { Currency } from "@/lib/types";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface Preferences {
  defaultCurrency: Currency;
  lastUsedAccountId?: string;
}

interface UserDoc {
  id: string;
  username: string;
  name?: string;
  preferences?: Preferences;
}

const DEFAULTS: Preferences = {
  defaultCurrency: "COP",
};

export async function GET() {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const db = await getDb();
  // Name + preferences both live on the user doc — a single read.
  const user = await db
    .collection<UserDoc>("users")
    .findOne(
      { id: uid },
      { projection: { _id: 0, name: 1, username: 1, preferences: 1 } },
    );

  return NextResponse.json({
    userName: user?.name ?? user?.username ?? "",
    defaultCurrency: user?.preferences?.defaultCurrency ?? DEFAULTS.defaultCurrency,
    lastUsedAccountId: user?.preferences?.lastUsedAccountId,
  });
}

export async function PATCH(req: Request) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const patch = (await req.json()) as Partial<Preferences>;
  const db = await getDb();

  // Build a dotted $set so we only touch the keys provided, never clobber siblings.
  const set: Record<string, unknown> = {};
  if (patch.defaultCurrency !== undefined)
    set["preferences.defaultCurrency"] = patch.defaultCurrency;
  if (patch.lastUsedAccountId !== undefined)
    set["preferences.lastUsedAccountId"] = patch.lastUsedAccountId;

  if (Object.keys(set).length > 0) {
    await db.collection<UserDoc>("users").updateOne({ id: uid }, { $set: set });
  }

  const user = await db
    .collection<UserDoc>("users")
    .findOne({ id: uid }, { projection: { _id: 0, preferences: 1 } });

  return NextResponse.json(user?.preferences ?? DEFAULTS);
}
