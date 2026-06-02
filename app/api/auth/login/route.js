import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { COOKIE, signSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

// Issue a session cookie carrying the account's current epoch.
async function withSession(db, json) {
  const auth = await db.collection("settings").findOne({ _id: "auth" });
  const epoch = Number(auth?.epoch) || 1;
  const res = NextResponse.json(json);
  res.cookies.set(COOKIE, await signSession(epoch), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}

async function savePassword(db, password) {
  const { salt, hash } = await hashPassword(password);
  await db.collection("settings").updateOne(
    { _id: "auth" },
    { $set: { salt, hash, updatedAt: new Date() }, $setOnInsert: { epoch: 1 } },
    { upsert: true }
  );
}

export async function POST(request) {
  let password = "";
  try {
    ({ password } = await request.json());
  } catch {}
  password = String(password || "");

  const db = await getDb();
  const auth = await db.collection("settings").findOne({ _id: "auth" });

  // 1) A password already lives in the DB — just verify it.
  if (auth?.hash) {
    if (!(await verifyPassword(password, auth.salt, auth.hash))) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
    return withSession(db, { ok: true });
  }

  // 2) No DB password yet, but APP_PASSWORD is set — verify against it once and
  //    migrate it into the DB so you can change it in-app from now on.
  const envPw = process.env.APP_PASSWORD || "";
  if (envPw) {
    if (password !== envPw) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }
    await savePassword(db, password);
    return withSession(db, { ok: true });
  }

  // 3) Nothing configured — first run. The password typed here becomes THE password.
  if (password.length < 4) {
    return NextResponse.json({ error: "Choose a password (min 4 characters)" }, { status: 400 });
  }
  await savePassword(db, password);
  return withSession(db, { ok: true, created: true });
}
