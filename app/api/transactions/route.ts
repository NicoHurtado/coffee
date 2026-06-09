import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/mongodb";
import { withRetry } from "@/lib/db/retry";
import { getTransactionsForUser } from "@/lib/db/queries";
import type { Transaction } from "@/lib/types";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  return NextResponse.json(await getTransactionsForUser(uid));
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
  // Cold serverless start: the very first connect of the day can be slow or
  // transiently fail. Retry once so it's invisible to the user instead of
  // surfacing as a "check your connection" error.
  await withRetry(async () => {
    const db = await getDb();
    await db.collection<Transaction>("transactions").insertOne(doc);
  });
  const { userId: _uid, ...out } = doc as unknown as { userId?: string; [k: string]: unknown };
  void _uid;
  return NextResponse.json(out, { status: 201 });
}
