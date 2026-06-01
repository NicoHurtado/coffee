import { NextResponse } from "next/server";
import { getCategories } from "@/lib/db/queries";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // Categories are shared reference presets, but only for authenticated users.
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await getCategories());
}
