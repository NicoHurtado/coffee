import { NextResponse } from "next/server";
import { getSession } from "./session";

/**
 * Returns the authenticated user's id, or a 401 response to return early.
 * Usage:
 *   const auth = await requireUid();
 *   if (auth instanceof NextResponse) return auth;
 *   const uid = auth;
 */
export async function requireUid(): Promise<string | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.uid;
}
