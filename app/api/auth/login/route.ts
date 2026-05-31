import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { COOKIE_NAME, signSession, verifyPassword } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface UserDoc {
  id: string;
  username: string;
  name?: string;
  passwordHash: string;
}

export async function POST(req: Request) {
  const limit = rateLimit(`login:${clientIp(req)}`, 10, 5 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = (await req.json()) as { username?: string; password?: string; remember?: boolean };
  const username = body.username?.trim().toLowerCase();
  const password = body.password;
  const remember = !!body.remember;

  if (!username || !password) {
    return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ username });
  if (!user) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const { token, maxAge } = await signSession(
    { uid: user.id, username: user.username, name: user.name ?? user.username },
    remember,
  );

  const res = NextResponse.json({ id: user.id, username: user.username });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}
