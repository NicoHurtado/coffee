import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local manually (no dotenv dep)
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

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const accountsCol = db.collection("accounts");
const txsCol = db.collection("transactions");
const settingsCol = db.collection("settings");

console.log("Wiping collections...");
await Promise.all([
  accountsCol.deleteMany({}),
  txsCol.deleteMany({}),
  settingsCol.deleteMany({}),
]);

const now = new Date();
const iso = (d) => d.toISOString();
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n) => new Date(now.getTime() - n * 60 * 60 * 1000);

const accounts = [
  {
    id: randomUUID(),
    type: "debit",
    institution: "Chase Bank",
    name: "Chase Checking",
    currency: "USD",
    initialBalance: 4200,
    createdAt: iso(daysAgo(120)),
    color: "blue",
    last4: "7321",
    network: "visa",
  },
  {
    id: randomUUID(),
    type: "debit",
    institution: "Bancolombia",
    name: "Ahorros COP",
    currency: "COP",
    initialBalance: 8500000,
    createdAt: iso(daysAgo(200)),
    color: "gold",
    last4: "0418",
    network: "mastercard",
  },
  {
    id: randomUUID(),
    type: "credit",
    institution: "Chase",
    name: "Sapphire Reserve",
    currency: "USD",
    initialBalance: 0,
    creditLimit: 15000,
    last4: "4823",
    expDate: "08/28",
    network: "visa",
    createdAt: iso(daysAgo(300)),
    color: "navy",
  },
  {
    id: randomUUID(),
    type: "credit",
    institution: "Apple",
    name: "Apple Card",
    currency: "USD",
    initialBalance: 0,
    creditLimit: 5000,
    last4: "9112",
    expDate: "03/29",
    network: "mastercard",
    createdAt: iso(daysAgo(180)),
    color: "silver",
  },
  {
    id: randomUUID(),
    type: "fixed_income",
    institution: "Nubank",
    name: "Cajita Nub",
    currency: "COP",
    initialBalance: 5000000,
    annualRate: 13.5,
    startDate: iso(daysAgo(180)).slice(0, 10),
    createdAt: iso(daysAgo(180)),
    color: "purple",
    isGoal: true,
    goalTarget: 8000000,
    miniLabel: "NUB",
  },
  {
    id: randomUUID(),
    type: "fixed_income",
    institution: "Bancolombia",
    name: "CDT 90 días",
    currency: "COP",
    initialBalance: 10000000,
    annualRate: 11.2,
    startDate: iso(daysAgo(45)).slice(0, 10),
    maturityDate: iso(daysAgo(-45)).slice(0, 10),
    createdAt: iso(daysAgo(45)),
    color: "emerald",
    miniLabel: "CDT",
  },
  {
    id: randomUUID(),
    type: "investment",
    institution: "Interactive Brokers",
    name: "IBKR Portfolio",
    currency: "USD",
    initialBalance: 12500,
    createdAt: iso(daysAgo(400)),
    color: "teal",
    miniLabel: "IBKR",
  },
  {
    id: randomUUID(),
    type: "investment",
    institution: "Binance",
    name: "Crypto",
    currency: "USD",
    initialBalance: 3200,
    createdAt: iso(daysAgo(250)),
    color: "magenta",
    miniLabel: "BTC",
  },
];

const [chase, bancolombia, sapphire, applecard, cajita, cdt, ibkr, binance] = accounts;

// Helper to build transactions
let txs = [];
const tx = (accountId, kind, amount, category, description, occurredAt) =>
  txs.push({
    id: randomUUID(),
    accountId,
    kind,
    amount,
    category,
    description,
    occurredAt: iso(occurredAt),
  });

// Today
tx(chase.id, "expense", 14.5, "Comida", "Almuerzo Sweetgreen", hoursAgo(2));
tx(sapphire.id, "expense", 89.9, "Shopping", "Uniqlo", hoursAgo(5));
tx(chase.id, "expense", 6.75, "Transporte", "Uber", hoursAgo(7));

// Yesterday
tx(chase.id, "expense", 42.3, "Comida", "Cena con amigos", daysAgo(1));
tx(applecard.id, "expense", 19.99, "Entretenimiento", "Spotify Family", daysAgo(1));
tx(chase.id, "income", 3200, "Trabajo", "Salario", daysAgo(1));

// Last week
for (let d = 2; d <= 6; d++) {
  tx(chase.id, "expense", 8 + Math.random() * 20, "Comida", "Café", daysAgo(d));
}
tx(sapphire.id, "expense", 220, "Viajes", "Hotel Airbnb", daysAgo(3));
tx(sapphire.id, "expense", 65, "Entretenimiento", "Concierto", daysAgo(4));
tx(applecard.id, "expense", 12.5, "Facturas", "iCloud", daysAgo(5));
tx(chase.id, "expense", 28, "Transporte", "Gasolina", daysAgo(6));
tx(bancolombia.id, "expense", 180000, "Hogar", "Servicios públicos", daysAgo(6));

// Two weeks ago
tx(chase.id, "income", 500, "Trabajo", "Freelance", daysAgo(10));
tx(sapphire.id, "expense", 340, "Salud", "Dentista", daysAgo(11));
tx(applecard.id, "expense", 75, "Shopping", "Amazon", daysAgo(12));
tx(chase.id, "expense", 95, "Comida", "Mercado", daysAgo(13));
tx(bancolombia.id, "expense", 450000, "Facturas", "Internet + celular", daysAgo(14));

// Three weeks ago
tx(sapphire.id, "expense", 1200, "Viajes", "Vuelo BOG-MIA", daysAgo(20));
tx(chase.id, "income", 3200, "Trabajo", "Salario", daysAgo(22));
tx(sapphire.id, "income", 600, "Otro", "Pago a tarjeta", daysAgo(25));
tx(applecard.id, "income", 200, "Otro", "Pago a tarjeta", daysAgo(27));

// Old transactions for monthly comparison
tx(chase.id, "expense", 50, "Educación", "Curso online", daysAgo(40));
tx(chase.id, "expense", 30, "Comida", "Restaurante", daysAgo(45));
tx(chase.id, "income", 3200, "Trabajo", "Salario", daysAgo(50));
tx(sapphire.id, "expense", 90, "Salud", "Farmacia", daysAgo(55));

console.log(`Inserting ${accounts.length} accounts and ${txs.length} transactions...`);
await accountsCol.insertMany(accounts);
await txsCol.insertMany(txs);
await settingsCol.updateOne(
  { _id: "singleton" },
  {
    $set: {
      userName: "Nicolás",
      defaultCurrency: "COP",
      lastUsedAccountId: chase.id,
    },
  },
  { upsert: true },
);

console.log("Done.");
await client.close();
