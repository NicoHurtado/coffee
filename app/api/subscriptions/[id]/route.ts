import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import type { Subscription } from "@/lib/types";
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
  const patch = (await req.json()) as Partial<Subscription>;
  const { id: _ignore, userId: _uidIgnore, ...rest } = patch as {
    id?: string;
    userId?: string;
    [k: string]: unknown;
  };
  void _ignore;
  void _uidIgnore;

  const db = await getDb();
  await db.collection<Subscription>("subscriptions").updateOne({ id, userId: uid }, { $set: rest });
  const doc = await db
    .collection<Subscription>("subscriptions")
    .findOne({ id, userId: uid }, { projection: { _id: 0, userId: 0 } });
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
  await db.collection("subscriptions").deleteOne({ id, userId: uid });
  return NextResponse.json({ ok: true });
}
