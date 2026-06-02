import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local manually (no dotenv dep) — same pattern as db-cleanup.mjs
const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const uri = env.MONGODB_URI;
const dbName = env.MONGODB_DB || "financepro";
const DRY = process.argv.includes("--dry");

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const coll = db.collection("transactions");

const log = (...a) => console.log(DRY ? "[DRY]" : "[RUN]", ...a);
console.log(`\nMigrate transfers on "${dbName}"${DRY ? " (dry-run, no changes)" : ""}\n`);

// Categorías que históricamente marcaron un traslado.
const TRANSFER_CATS = ["Transferencia", "Traslado"];

try {
  // 1. Patas existentes kind:"transfer" sin direction → eran salidas ("out").
  const r1 = await coll.updateMany(
    { kind: "transfer", direction: { $exists: false } },
    { $set: { direction: "out", category: "Traslado" } },
  );
  log(`transfer sin direction → out: matched ${r1.matchedCount}, modified ${DRY ? "-" : r1.modifiedCount}`);

  // 2. Entradas: income que en realidad eran traslado (pareadas o categoría Transferencia)
  //    → kind:"transfer", direction:"in". No cambia el saldo (sigue sumando), pero
  //    deja de contar como ingreso del mes.
  const inFilter = {
    kind: "income",
    $or: [{ transferPairId: { $exists: true, $ne: null } }, { category: { $in: TRANSFER_CATS } }],
  };
  const r2 = DRY
    ? { matchedCount: await coll.countDocuments(inFilter) }
    : await coll.updateMany(inFilter, { $set: { kind: "transfer", direction: "in", category: "Traslado" } });
  log(`income → transfer/in: matched ${r2.matchedCount}, modified ${DRY ? "-" : r2.modifiedCount}`);

  // 3. Salidas: expense con categoría Transferencia → kind:"transfer", direction:"out".
  //    No cambia el saldo (sigue restando), pero deja de contar como gasto del mes.
  const outFilter = { kind: "expense", category: { $in: TRANSFER_CATS } };
  const r3 = DRY
    ? { matchedCount: await coll.countDocuments(outFilter) }
    : await coll.updateMany(outFilter, { $set: { kind: "transfer", direction: "out", category: "Traslado" } });
  log(`expense → transfer/out: matched ${r3.matchedCount}, modified ${DRY ? "-" : r3.modifiedCount}`);

  console.log("\nDone.\n");
} finally {
  await client.close();
}
