import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/mongodb";
import { getAccountsForUser } from "@/lib/db/queries";
import type { Account } from "@/lib/types";
import { encrypt } from "@/lib/crypto";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  return NextResponse.json(await getAccountsForUser(uid));
}

export async function POST(req: Request) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const body = (await req.json()) as Partial<Account> & { syncToken?: string };
  // Encrypt syncToken before storing
  if (typeof body.syncToken === "string" && body.syncToken) {
    body.syncToken = encrypt(body.syncToken);
  }
  // Respect client-supplied id/createdAt (optimistic UI) so client and DB agree.
  // userId always comes from the session — never trust the client for ownership.
  const doc = {
    ...body,
    userId: uid,
    id: body.id ?? uuid(),
    createdAt: body.createdAt ?? new Date().toISOString(),
  } as Account & { userId: string };
  const db = await getDb();
  await db.collection<Account>("accounts").insertOne(doc);
  // Return without syncToken / userId
  const { syncToken: _omit, userId: _uid, ...docOut } = doc as unknown as {
    syncToken?: string;
    userId?: string;
    [k: string]: unknown;
  };
  void _omit;
  void _uid;
  return NextResponse.json(docOut, { status: 201 });
}
