import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import type { Account } from "@/lib/types";
import { encrypt } from "@/lib/crypto";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const { id } = await params;
  const patch = (await req.json()) as Partial<Account> & { syncToken?: string };
  const db = await getDb();
  // Strip fields the client must never override.
  const { id: _ignore, userId: _uidIgnore, ...rest } = patch as {
    id?: string;
    userId?: string;
    [k: string]: unknown;
  };
  void _ignore;
  void _uidIgnore;

  // Encrypt syncToken before storing — never save plain text
  if (typeof rest.syncToken === "string" && rest.syncToken) {
    rest.syncToken = encrypt(rest.syncToken);
  }

  // Filter by userId so a user can only modify their own accounts.
  await db.collection<Account>("accounts").updateOne({ id, userId: uid }, { $set: rest });

  // Return doc without syncToken (server-only secret)
  const doc = await db.collection<Account>("accounts").findOne(
    { id, userId: uid },
    { projection: { _id: 0, syncToken: 0, userId: 0 } },
  );
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const { id } = await params;
  const db = await getDb();
  await db.collection("accounts").deleteOne({ id, userId: uid });
  await db.collection("transactions").deleteMany({ accountId: id, userId: uid });
  return NextResponse.json({ ok: true });
}
