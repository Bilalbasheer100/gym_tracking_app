import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// Tells the login page whether to show "enter password" or first-run
// "create a password". Safe to be public (reveals only a boolean).
export async function GET() {
  const db = await getDb();
  const auth = await db.collection("settings").findOne({ _id: "auth" });
  const configured = !!auth?.hash || !!process.env.APP_PASSWORD;
  return NextResponse.json({ configured });
}
