import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { outMany, out } from "@/lib/serialize";
import { todayStr } from "@/lib/date";

export const dynamic = "force-dynamic";

// GET all weigh-ins (oldest -> newest) for the trend chart.
export async function GET() {
  const db = await getDb();
  const docs = await db.collection("weights").find({}).sort({ date: 1 }).toArray();
  return NextResponse.json(outMany(docs));
}

// POST a weigh-in. One per day: re-posting the same date overwrites it.
export async function POST(request) {
  const b = await request.json();
  const date = b.date || todayStr();
  const weight = Number(b.weight);
  if (!weight || weight <= 0)
    return NextResponse.json({ error: "Enter a valid weight" }, { status: 400 });

  const db = await getDb();
  await db
    .collection("weights")
    .updateOne(
      { date },
      { $set: { date, weight, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  const doc = await db.collection("weights").findOne({ date });
  return NextResponse.json(out(doc), { status: 201 });
}
