import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "financepro";

if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoIndexesReady: Promise<void> | undefined;
}

const clientPromise: Promise<MongoClient> =
  global._mongoClientPromise ??
  (global._mongoClientPromise = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 60_000,
    serverSelectionTimeoutMS: 5_000,
    // Lower latency by skipping retryable-write bookkeeping on idempotent ops
    retryWrites: true,
  }).connect());

// Build indexes once per process, in the background — never blocks a request.
// Each index is created independently so a name/spec conflict on one
// (e.g. an equivalent index built earlier under a different name) never
// prevents the others from being created.
async function ensureIndexes(db: Db): Promise<void> {
  const jobs: Array<Promise<unknown>> = [
    // All data queries are scoped by userId, so userId leads every index.
    db.collection("transactions").createIndex(
      { userId: 1, occurredAt: -1 },
      { name: "userId_occurredAt_desc" },
    ),
    db.collection("transactions").createIndex({ userId: 1, id: 1 }, { name: "userId_id" }),
    db.collection("transactions").createIndex(
      { userId: 1, accountId: 1, occurredAt: -1 },
      { name: "userId_accountId_occurredAt_desc" },
    ),
    db.collection("accounts").createIndex({ userId: 1 }, { name: "userId" }),
    db.collection("accounts").createIndex({ userId: 1, id: 1 }, { name: "userId_id" }),
    db.collection("settings").createIndex({ userId: 1 }, { name: "userId_unique", unique: true }),
    db.collection("users").createIndex({ username: 1 }, { name: "username_unique", unique: true }),
  ];
  await Promise.allSettled(jobs);
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  const db = client.db(dbName);
  // Fire-and-forget: indexes build in the background, requests don't wait.
  global._mongoIndexesReady ??= ensureIndexes(db).catch((e) => {
    console.error("[mongodb] ensureIndexes failed", e);
    global._mongoIndexesReady = undefined;
  });
  return db;
}
