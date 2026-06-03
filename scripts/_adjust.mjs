import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const c = new MongoClient(env.MONGODB_URI);
await c.connect();
const db = c.db(env.MONGODB_DB || "financepro");
const accId = "e1f6237e-ce3b-42cd-8699-10b20da55333"; // Nu Debito
const r = await db.collection("accounts").updateOne(
  { id: accId },
  { $inc: { initialBalance: -3032 } },
);
const a = await db.collection("accounts").findOne({ id: accId }, { projection: { name: 1, initialBalance: 1, _id: 0 } });
console.log("matched", r.matchedCount, "modified", r.modifiedCount, "->", JSON.stringify(a));
await c.close();
