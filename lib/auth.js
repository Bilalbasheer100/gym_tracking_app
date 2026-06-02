// Edge-safe auth helpers (no DB, no Node-only APIs) so this can run inside
// middleware. The session cookie is `<epoch>.<hmac>` — the HMAC is signed with
// AUTH_SECRET and covers the epoch, so the cookie is tamper-proof and verifying
// it needs only AUTH_SECRET. The epoch lets us invalidate every cookie at once
// (see "log out all devices") by bumping a counter in the database.

export const COOKIE = "gt_session";

// Auth is enforced whenever a signing secret (or legacy password) is set.
export function authEnabled() {
  return !!(process.env.AUTH_SECRET || process.env.APP_PASSWORD);
}

async function hmacHex(key, msg) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Build a cookie value for the given session epoch.
export async function signSession(epoch) {
  const secret = process.env.AUTH_SECRET || "gym-tracker-default-secret";
  const sig = await hmacHex(secret, `session-v1:${epoch}`);
  return `${epoch}.${sig}`;
}

// Returns the epoch number if the cookie's signature is valid, else null.
export async function verifySession(value) {
  if (!value || typeof value !== "string") return null;
  const dot = value.indexOf(".");
  if (dot < 1) return null;
  const epoch = Number(value.slice(0, dot));
  if (!Number.isFinite(epoch)) return null;

  const expected = await signSession(epoch);
  if (expected.length !== value.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ value.charCodeAt(i);
  return diff === 0 ? epoch : null;
}
