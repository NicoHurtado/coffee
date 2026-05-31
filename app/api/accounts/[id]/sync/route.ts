import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import type { Account, InvestmentAccount } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { decrypt, isEncrypted } from "@/lib/crypto";
import { requireUid } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function parseNAV(xml: string): number | null {
  // Try summary-level fields first
  const equityMatch = xml.match(/EquitySummaryByReportDateInBase[^>]+total="([^"]+)"/);
  if (equityMatch) return parseFloat(equityMatch[1]);

  const navMatch = xml.match(/NetAssetValue[^>]+total="([^"]+)"/);
  if (navMatch) return parseFloat(navMatch[1]);

  const netLiqMatch = xml.match(/NetLiquidation[^>]*value="([^"]+)"/);
  if (netLiqMatch) return parseFloat(netLiqMatch[1]);

  // Derive NAV from OpenPositions:
  // NAV = sum(positionValue) / (sum(percentOfNAV) / 100)
  // This correctly accounts for cash (the remaining % not in positions)
  const posRegex = /positionValue="([^"]+)"[^>]*percentOfNAV="([^"]+)"/g;
  let totalPV = 0;
  let totalPct = 0;
  let match;
  while ((match = posRegex.exec(xml)) !== null) {
    const pv = parseFloat(match[1]);
    const pct = parseFloat(match[2]);
    if (!isNaN(pv) && !isNaN(pct) && pct > 0) {
      totalPV += pv;
      totalPct += pct;
    }
  }
  if (totalPct > 0) {
    const nav = totalPV / (totalPct / 100);
    // Log each position for debugging
    const posDetails: string[] = [];
    const detailRegex = /symbol="([^"]+)"[^>]*positionValue="([^"]+)"[^>]*percentOfNAV="([^"]+)"/g;
    let dm;
    while ((dm = detailRegex.exec(xml)) !== null) {
      posDetails.push(`${dm[1]}: $${dm[2]} (${dm[3]}%)`);
    }
    console.log("[IBKR sync] Posiciones:");
    posDetails.forEach(p => console.log("  ", p));
    console.log(`[IBKR sync] Suma posiciones: $${totalPV.toFixed(2)} | Suma %NAV: ${totalPct.toFixed(2)}% | NAV calculado: $${nav.toFixed(2)}`);
    console.log(`[IBKR sync] Efectivo estimado: $${(nav - totalPV).toFixed(2)} (${(100 - totalPct).toFixed(2)}% del NAV)`);
    return Math.round(nav * 100) / 100;
  }

  // Fallback: sum all positionValue attributes
  const pvRegex = /positionValue="([^"]+)"/g;
  let total = 0;
  let found = false;
  while ((match = pvRegex.exec(xml)) !== null) {
    const v = parseFloat(match[1]);
    if (!isNaN(v)) { total += v; found = true; }
  }
  if (found) return total;

  return null;
}

async function fetchIBKR(sendUrl: string, token: string): Promise<number> {
  // Step 1: request statement
  const sep = sendUrl.includes("?") ? "&" : "?";
  const requestUrl = `${sendUrl}${sep}t=${token}`;
  console.log("[IBKR sync] Step 1 URL:", requestUrl.replace(token, "***"));

  const res1 = await fetch(requestUrl);
  const xml1 = await res1.text();
  console.log("[IBKR sync] Step 1 response:", xml1.slice(0, 500));

  const statusMatch = xml1.match(/<Status>([^<]+)<\/Status>/);
  const status = statusMatch?.[1];
  if (status !== "Success") {
    const errMatch = xml1.match(/<ErrorMessage>([^<]+)<\/ErrorMessage>/);
    const msg = errMatch?.[1] ?? `IBKR status: ${status ?? "unknown"} — raw: ${xml1.slice(0, 300)}`;
    throw new Error(msg);
  }

  const refMatch = xml1.match(/<ReferenceCode>([^<]+)<\/ReferenceCode>/);
  const urlMatch = xml1.match(/<Url>([^<]+)<\/Url>/);
  if (!refMatch) throw new Error(`No ReferenceCode in response: ${xml1.slice(0, 300)}`);

  const referenceCode = refMatch[1];
  const baseUrl = urlMatch?.[1] ?? "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/GetStatement";
  console.log("[IBKR sync] ReferenceCode:", referenceCode, "BaseUrl:", baseUrl);

  // Step 2: wait then fetch the statement
  await new Promise((r) => setTimeout(r, 2000));
  const getUrl = `${baseUrl}?q=${referenceCode}&t=${token}&v=3`;
  const res2 = await fetch(getUrl);
  const xml2 = await res2.text();
  console.log("[IBKR sync] Step 2 response (first 2000):", xml2.slice(0, 2000));

  const nav = parseNAV(xml2);
  if (nav === null) throw new Error(`No se pudo extraer el balance. XML preview: ${xml2.slice(0, 400)}`);
  return nav;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const { id } = await params;
  const db = await getDb();

  const account = await db.collection<Account>("accounts").findOne({ id, userId: uid }, { projection: { _id: 0 } }) as InvestmentAccount | null;
  if (!account || account.type !== "investment") {
    return NextResponse.json({ error: "Cuenta no encontrada o no es de inversión" }, { status: 404 });
  }
  if (!account.syncUrl || !account.syncToken) {
    return NextResponse.json({ error: "Cuenta sin configuración de sincronización" }, { status: 400 });
  }

  try {
    // Decrypt token — it's stored encrypted in DB
    const rawToken = isEncrypted(account.syncToken) ? decrypt(account.syncToken) : account.syncToken;
    const nav = await fetchIBKR(account.syncUrl, rawToken);

    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const dayStart = `${today}T00:00:00.000Z`;
    const nextDay = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);
    const dayEnd = `${nextDay}T00:00:00.000Z`;

    // One sync adjustment per account per day: re-syncing the same day updates
    // the existing adjustment instead of piling up duplicate rows.
    const filter = {
      userId: uid,
      accountId: id,
      kind: "adjustment" as const,
      description: "Sincronización IBKR",
      occurredAt: { $gte: dayStart, $lt: dayEnd },
    };
    await db.collection("transactions").updateOne(
      filter,
      {
        $set: { amount: nav, occurredAt: now.toISOString() },
        $setOnInsert: { id: uuidv4(), category: "Otro" },
      },
      { upsert: true },
    );

    // Mark account as synced today
    await db.collection("accounts").updateOne({ id, userId: uid }, { $set: { lastSyncDate: today } });

    return NextResponse.json({ balance: nav, lastSyncDate: today });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
