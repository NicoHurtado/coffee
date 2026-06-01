import { getDb } from "./mongodb";
import type { Account, Currency, Transaction } from "@/lib/types";

/**
 * Server-side data access, shared by the API routes and the (app) layout's
 * initial prefetch. Single source of truth for what the client receives:
 * every projection here matches what the GET routes used to return inline.
 */

export interface SettingsData {
  userName: string;
  defaultCurrency: Currency;
  lastUsedAccountId?: string;
}

export interface CategoryData {
  name: string;
  color: string;
}

interface UserDoc {
  id: string;
  username: string;
  name?: string;
  preferences?: {
    defaultCurrency: Currency;
    lastUsedAccountId?: string;
  };
}

export async function getAccountsForUser(uid: string): Promise<Account[]> {
  const db = await getDb();
  // Never send _id, syncToken or userId to the client.
  return db
    .collection<Account>("accounts")
    .find({ userId: uid }, { projection: { _id: 0, syncToken: 0, userId: 0 } })
    .toArray();
}

export async function getTransactionsForUser(uid: string): Promise<Transaction[]> {
  const db = await getDb();
  return db
    .collection<Transaction>("transactions")
    .find({ userId: uid }, { projection: { _id: 0, userId: 0 } })
    .sort({ occurredAt: -1 })
    .toArray();
}

export async function getSettingsForUser(uid: string): Promise<SettingsData> {
  const db = await getDb();
  const user = await db
    .collection<UserDoc>("users")
    .findOne(
      { id: uid },
      { projection: { _id: 0, name: 1, username: 1, preferences: 1 } },
    );
  return {
    userName: user?.name ?? user?.username ?? "",
    defaultCurrency: user?.preferences?.defaultCurrency ?? "COP",
    lastUsedAccountId: user?.preferences?.lastUsedAccountId,
  };
}

export async function getCategories(): Promise<CategoryData[]> {
  const db = await getDb();
  return db
    .collection<CategoryData>("categories")
    .find({}, { projection: { _id: 0, name: 1, color: 1 } })
    .toArray();
}
