import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-fallback",
);

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
