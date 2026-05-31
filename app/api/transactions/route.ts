import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/mongodb";
import type { Transaction } from "@/lib/types";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const db = await getDb();
  const docs = await db
    .collection<Transaction>("transactions")
    .find({ userId: uid }, { projection: { _id: 0, userId: 0 } })
    .sort({ occurredAt: -1 })
    .toArray();
  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const body = (await req.json()) as Partial<Transaction>;
  // Respect a client-supplied id (optimistic UI); ownership always from session.
  const doc = { ...body, userId: uid, id: body.id ?? uuid() } as Transaction & {
    userId: string;
  };
  const db = await getDb();
  await db.collection<Transaction>("transactions").insertOne(doc);
  const { userId: _uid, ...out } = doc as unknown as { userId?: string; [k: string]: unknown };
  void _uid;
  return NextResponse.json(out, { status: 201 });
}
