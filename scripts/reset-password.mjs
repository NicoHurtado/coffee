// Resets a user's password. Run it yourself in your own terminal:
//   node scripts/reset-password.mjs <username>
// It will prompt for the new password (input hidden) — never pass it as a
// CLI argument or paste it anywhere else, since that would leak it into
// shell history / logs.
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const username = process.argv[2]?.trim().toLowerCase();
if (!username) {
  console.error("Uso: node scripts/reset-password.mjs <username>");
  process.exit(1);
}

function promptHidden(question) {
  return new Promise((resolvePromise) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    let input = "";
    const onData = (char) => {
      if (char === "\n" || char === "\r" || char === "") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolvePromise(input);
        return;
      }
      if (char === "") process.exit(1); // Ctrl+C
      if (char === "") {
        input = input.slice(0, -1); // backspace
        return;
      }
      input += char;
    };
    stdin.on("data", onData);
  });
}

const password = await promptHidden("Nueva contraseña (mín. 6 caracteres): ");
if (!password || password.length < 6) {
  console.error("Contraseña muy corta (mín. 6).");
  process.exit(1);
}
const confirm = await promptHidden("Confírmala: ");
if (confirm !== password) {
  console.error("No coinciden.");
  process.exit(1);
}

const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.MONGODB_DB || "financepro");
const users = db.collection("users");

const user = await users.findOne({ username });
if (!user) {
  console.error(`No existe el usuario "${username}".`);
  await client.close();
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
await users.updateOne({ username }, { $set: { passwordHash } });

console.log(`Contraseña actualizada para "${username}".`);
await client.close();
