import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Protected by middleware (signed-in only). Bumping the epoch invalidates every
// existing session cookie everywhere; we also clear this device's cookie so the
// user re-logs in cleanly.
export async function POST() {
  const db = await getDb();
  const auth = await db.collection("settings").findOne({ _id: "auth" });
  const next = (Number(auth?.epoch) || 1) + 1;
  await db
    .collection("settings")
    .updateOne({ _id: "auth" }, { $set: { epoch: next } }, { upsert: true });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
