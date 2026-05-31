import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local manually (no dotenv dep) — same pattern as seed.mjs
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

const log = (...a) => console.log(DRY ? "[DRY]" : "[RUN]", ...a);
console.log(`\nDB cleanup on "${dbName}"${DRY ? " (dry-run, no changes)" : ""}\n`);

// Helper: drop an index only if it exists
async function dropIndexSafe(coll, name) {
  const idx = await db.collection(coll).indexes();
  if (!idx.some((i) => i.name === name)) {
    log(`skip  ${coll}.${name} (not present)`);
    return;
  }
  log(`drop index ${coll}.${name}`);
  if (!DRY) await db.collection(coll).dropIndex(name);
}

// Helper: drop a collection only if it exists and (optionally) is empty
async function dropCollectionSafe(coll, { requireEmpty = true } = {}) {
  const exists = (await db.listCollections({ name: coll }).toArray()).length > 0;
  if (!exists) return log(`skip  collection ${coll} (not present)`);
  const count = await db.collection(coll).countDocuments();
  if (requireEmpty && count > 0)
    return log(`skip  collection ${coll} (NOT empty: ${count} docs)`);
  log(`drop collection ${coll} (${count} docs)`);
  if (!DRY) await db.collection(coll).drop();
}

try {
  // 1. Remove unused, now-embedded settings collection (only if empty)
  await dropCollectionSafe("settings", { requireEmpty: true });

  // 2. Redundant / unused indexes. id_unique is kept on purpose (uuid guard).
  await dropIndexSafe("accounts", "userId"); // prefix of userId_id
  await dropIndexSafe("accounts", "active"); // queries are userId-scoped
  await dropIndexSafe("transactions", "occurredAt_desc"); // covered by userId_occurredAt_desc
  await dropIndexSafe("transactions", "accountId_occurredAt_desc"); // covered by userId_accountId_occurredAt_desc

  // 3. De-duplicate IBKR sync adjustments: keep the latest per account per day.
  const groups = await db
    .collection("transactions")
    .aggregate([
      { $match: { description: "Sincronización IBKR", kind: "adjustment" } },
      { $addFields: { day: { $substr: ["$occurredAt", 0, 10] } } },
      { $sort: { occurredAt: 1 } },
      {
        $group: {
          _id: { acc: "$accountId", day: "$day" },
          ids: { $push: "$_id" }, // already sorted ascending by occurredAt
        },
      },
    ])
    .toArray();
  // Keep the latest (last) per day-group, mark the rest for removal.
  const toRemove = groups.flatMap((g) => g.ids.slice(0, -1));
  log(`dedupe sync adjustments: ${toRemove.length} duplicate(s) to remove`);
  if (!DRY && toRemove.length > 0) {
    const r = await db.collection("transactions").deleteMany({ _id: { $in: toRemove } });
    log(`  deleted ${r.deletedCount}`);
  }

  // 4. Report username index uniqueness (informational — fix is in app code).
  const userIdx = await db.collection("users").indexes();
  const uname = userIdx.find((i) => i.key && i.key.username === 1);
  if (!uname) {
    log("WARN users: no index on { username: 1 }");
  } else if (!uname.unique) {
    log(
      `WARN users: index "${uname.name}" on username is NOT unique. ` +
        `Drop it so the app recreates "username_unique":  db.users.dropIndex("${uname.name}")`,
    );
  } else {
    log(`ok    users: "${uname.name}" enforces unique username`);
  }

  console.log("\nDone.\n");
} finally {
  await client.close();
}
