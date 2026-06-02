import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

// Protected by middleware (not in the public-auth allowlist), so the caller is
// already signed in. We still require the current password as a safety check.
export async function POST(request) {
  let current = "";
  let next = "";
  try {
    ({ current, next } = await request.json());
  } catch {}
  next = String(next || "");
  current = String(current || "");

  if (next.length < 4) {
    return NextResponse.json({ error: "New password must be at least 4 characters" }, { status: 400 });
  }

  const db = await getDb();
  const auth = await db.collection("settings").findOne({ _id: "auth" });

  let ok = false;
  if (auth?.hash) ok = await verifyPassword(current, auth.salt, auth.hash);
  else if (process.env.APP_PASSWORD) ok = current === process.env.APP_PASSWORD;
  else ok = true; // not configured yet

  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const { salt, hash } = await hashPassword(next);
  await db.collection("settings").updateOne(
    { _id: "auth" },
    { $set: { salt, hash, updatedAt: new Date() }, $setOnInsert: { epoch: 1 } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
