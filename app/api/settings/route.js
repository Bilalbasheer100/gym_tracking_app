import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  calories: 2200,
  protein: 160,
  carbs: 220,
  fat: 70,
  unit: "kg",
};

export async function GET() {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ _id: "goals" });
  const { _id, ...rest } = doc || {};
  return NextResponse.json({ ...DEFAULTS, ...rest });
}

export async function PUT(request) {
  const body = await request.json();
  const update = {};
  for (const k of ["calories", "protein", "carbs", "fat"]) {
    if (body[k] != null) update[k] = Math.max(0, Number(body[k]) || 0);
  }
  if (body.unit === "kg" || body.unit === "lb") update.unit = body.unit;

  const db = await getDb();
  await db
    .collection("settings")
    .updateOne({ _id: "goals" }, { $set: update }, { upsert: true });

  const doc = await db.collection("settings").findOne({ _id: "goals" });
  const { _id, ...rest } = doc || {};
  return NextResponse.json({ ...DEFAULTS, ...rest });
}
