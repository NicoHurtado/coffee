import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db/mongodb";
import { hashPassword, signSession, COOKIE_NAME } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Registration is closed by default. Set ALLOW_REGISTRATION="true" to open it
// (e.g. temporarily, to create the owner account), then unset it again.
function registrationOpen(): boolean {
  return process.env.ALLOW_REGISTRATION === "true";
}

interface UserDoc {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export async function POST(req: Request) {
  if (!registrationOpen()) {
    return NextResponse.json({ error: "El registro está deshabilitado" }, { status: 403 });
  }

  const limit = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = (await req.json()) as {
    name?: string;
    username?: string;
    password?: string;
    remember?: boolean;
  };
  const name = body.name?.trim();
  const username = body.username?.trim().toLowerCase();
  const password = body.password;
  const remember = !!body.remember;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Escribe tu nombre (mín. 2)" }, { status: 400 });
  }
  if (!username || username.length < 3) {
    return NextResponse.json({ error: "Usuario muy corto (mín. 3)" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Contraseña muy corta (mín. 6)" }, { status: 400 });
  }
  if (!/^[a-z0-9._-]+$/i.test(username)) {
    return NextResponse.json(
      { error: "Solo letras, números, punto, guion y guion bajo" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const users = db.collection<UserDoc>("users");
  await users.createIndex({ username: 1 }, { unique: true });

  const existing = await users.findOne({ username });
  if (existing) {
    return NextResponse.json({ error: "Ese usuario ya existe" }, { status: 409 });
  }

  const user: UserDoc = {
    id: uuid(),
    username,
    name,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await users.insertOne(user);

  const { token, maxAge } = await signSession(
    { uid: user.id, username: user.username, name: user.name },
    remember,
  );

  const res = NextResponse.json({ id: user.id, username: user.username, name: user.name });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}
