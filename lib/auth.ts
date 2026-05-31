import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

function resolveSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  // Never allow a weak/known secret in production — it would let anyone forge sessions.
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET env var missing or too short (min 32 chars)");
  }
  return s ?? "dev-only-insecure-fallback";
}

const secret = new TextEncoder().encode(resolveSecret());

export const COOKIE_NAME = "fp_session";
const SHORT_TTL_SECONDS = 60 * 60 * 24; // 1 day (no recordarme)
const LONG_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days (recordarme)

export interface SessionPayload {
  uid: string;
  username: string;
  name: string;
}

export async function signSession(
  payload: SessionPayload,
  remember: boolean,
): Promise<{ token: string; maxAge: number }> {
  const maxAge = remember ? LONG_TTL_SECONDS : SHORT_TTL_SECONDS;
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret);
  return { token, maxAge };
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.uid !== "string" || typeof payload.username !== "string") return null;
    return {
      uid: payload.uid,
      username: payload.username,
      name: typeof payload.name === "string" ? payload.name : payload.username,
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
