import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // Categories are shared reference presets, but only for authenticated users.
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;

  const db = await getDb();
  const docs = await db
    .collection("categories")
    .find({}, { projection: { _id: 0, name: 1, color: 1 } })
    .toArray();
  return NextResponse.json(docs);
}
