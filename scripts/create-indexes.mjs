// Run once: node scripts/create-indexes.mjs
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "financepro";

if (!uri) {
  console.error("Set MONGODB_URI env var");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

// transactions: sort by date (primary query pattern)
await db.collection("transactions").createIndex(
  { occurredAt: -1 },
  { name: "occurredAt_desc", background: true },
);
console.log("✓ transactions.occurredAt_desc");

// transactions: filter by account then sort by date
await db.collection("transactions").createIndex(
  { accountId: 1, occurredAt: -1 },
  { name: "accountId_occurredAt_desc", background: true },
);
console.log("✓ transactions.accountId_occurredAt_desc");

// accounts: active flag filter
await db.collection("accounts").createIndex(
  { active: 1 },
  { name: "active", background: true },
);
console.log("✓ accounts.active");

await client.close();
console.log("\nDone. Indexes created.");
