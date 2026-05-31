import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

declare global {
  // eslint-disable-next-line no-var
  var _trmCache: { rate: number; date: string; fetchedAt: number } | null;
}
global._trmCache ??= null;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const cache = global._trmCache;
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json({ rate: cache.rate, date: cache.date, source: "cache" });
  }
  try {
    // TRM oficial — Superintendencia Financiera vía datos.gov.co
    const res = await fetch(
      "https://www.datos.gov.co/resource/mcec-87by.json?$limit=1&$order=vigenciadesde+DESC",
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Empty response");
    const rate = parseFloat(data[0].valor);
    const date: string = data[0].vigenciadesde?.slice(0, 10) ?? "";
    if (isNaN(rate)) throw new Error("Invalid rate value");
    global._trmCache = { rate, date, fetchedAt: Date.now() };
    return NextResponse.json({ rate, date });
  } catch {
    return NextResponse.json({ error: "No se pudo obtener la TRM" }, { status: 503 });
  }
}
