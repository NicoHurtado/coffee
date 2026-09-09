import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import type { Account, Transaction } from "@/lib/types";
import { requireUid } from "@/lib/api-auth";
import { ZodError } from "zod";
import { parseTransaction } from "@/lib/finance/transaction-validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const { id } = await params;
  const patch = (await req.json()) as Partial<Transaction>;
  const db = await getDb();
  const { id: _ignore, userId: _uidIgnore, ...rest } = patch as {
    id?: string;
    userId?: string;
    [k: string]: unknown;
  };
  void _ignore;
  void _uidIgnore;
  const current = await db
    .collection<Transaction>("transactions")
    .findOne({ id, userId: uid });
  if (!current) return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });

  let next: Transaction;
  try {
    next = parseTransaction({ ...current, ...rest, id: current.id });
  } catch (error) {
    const details = error instanceof ZodError ? error.issues : undefined;
    return NextResponse.json({ error: "Transacción inválida", details }, { status: 400 });
  }
  const account = await db
    .collection<Account>("accounts")
    .findOne({ id: next.accountId, userId: uid });
  if (!account) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  if (next.kind === "adjustment" && account.type !== "investment") {
    return NextResponse.json({ error: "Los ajustes absolutos solo aplican a inversiones" }, { status: 400 });
  }
  if (current.kind === "transfer") {
    if (next.kind !== "transfer" || next.accountId !== current.accountId || next.direction !== current.direction || next.transferPairId !== current.transferPairId) {
      return NextResponse.json({ error: "No se puede cambiar la estructura de un traslado" }, { status: 400 });
    }
    await db.collection<Transaction>("transactions").updateMany(
      { transferPairId: current.transferPairId, userId: uid },
      { $set: { amount: next.amount, occurredAt: next.occurredAt } },
    );
  }
  await db.collection<Transaction>("transactions").updateOne({ id, userId: uid }, { $set: rest });
  const doc = await db
    .collection<Transaction>("transactions")
    .findOne({ id, userId: uid }, { projection: { _id: 0, userId: 0 } });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUid();
  if (auth instanceof NextResponse) return auth;
  const uid = auth;

  const { id } = await params;
  const db = await getDb();
  await db.collection("transactions").deleteOne({ id, userId: uid });
  return NextResponse.json({ ok: true });
}
