import { MongoServerSelectionError, MongoNetworkError } from "mongodb";

// Only retry failures that happen while *establishing* a connection — server
// selection / network handshake errors. These occur before any write reaches
// the server, so retrying can't duplicate an insert. We deliberately do NOT
// retry post-write errors (e.g. timeouts after the op was sent), which could.
function isColdConnectError(err: unknown): boolean {
  return err instanceof MongoServerSelectionError || err instanceof MongoNetworkError;
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isColdConnectError(err)) throw err;
    }
  }
  throw lastErr;
}
