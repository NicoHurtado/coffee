import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/mongodb";
import { getSubscriptionsForUser } from "@/lib/db/queries";
import type { Subscription } from "@/lib/types";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  return NextResponse.json(await getSubscriptionsForUser(uid));
}

export async function POST(req: Request) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const body = (await req.json()) as Partial<Subscription>;
  const doc = {
    ...body,
    userId: uid,
    id: body.id ?? uuid(),
    createdAt: body.createdAt ?? new Date().toISOString(),
    active: body.active ?? true,
  } as Subscription & { userId: string };
  const db = await getDb();
  await db.collection<Subscription>("subscriptions").insertOne(doc);
  const { userId: _uid, ...out } = doc as unknown as { userId?: string; [k: string]: unknown };
  void _uid;
  return NextResponse.json(out, { status: 201 });
}
