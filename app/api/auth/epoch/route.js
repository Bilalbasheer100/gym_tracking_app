import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// Current session epoch. Read by the middleware to reject cookies issued before
// the last "log out all devices". Returns only a number, so it's safe to be public.
export async function GET() {
  const db = await getDb();
  const auth = await db.collection("settings").findOne({ _id: "auth" });
  return NextResponse.json({ epoch: Number(auth?.epoch) || 1 });
}
