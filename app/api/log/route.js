import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { outMany, out, toObjectId } from "@/lib/serialize";
import { todayStr } from "@/lib/date";

export const dynamic = "force-dynamic";

function totals(entries) {
  return entries.reduce(
    (t, e) => ({
      kcal: t.kcal + (e.kcal || 0),
      protein: t.protein + (e.protein || 0),
      carbs: t.carbs + (e.carbs || 0),
      fat: t.fat + (e.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// GET /api/log?date=YYYY-MM-DD -> { date, entries, totals }
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayStr();
  const db = await getDb();
  const docs = await db
    .collection("log")
    .find({ date })
    .sort({ createdAt: 1 })
    .toArray();
  const entries = outMany(docs);
  return NextResponse.json({ date, entries, totals: totals(entries) });
}

// POST a logged food. Accepts raw macros, or a foodId + qty to copy from library.
export async function POST(request) {
  const b = await request.json();
  const date = b.date || todayStr();
  const qty = Math.max(0.01, Number(b.qty) || 1);
  const db = await getDb();

  let base = {
    name: (b.name || "").trim(),
    kcal: Number(b.kcal) || 0,
    protein: Number(b.protein) || 0,
    carbs: Number(b.carbs) || 0,
    fat: Number(b.fat) || 0,
  };

  if (b.foodId) {
    const food = await db.collection("foods").findOne({ _id: toObjectId(b.foodId) });
    if (food) {
      base = {
        name: food.name,
        kcal: food.kcal,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      };
      await db.collection("foods").updateOne({ _id: food._id }, { $inc: { uses: 1 } });
    }
  }

  if (!base.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const doc = {
    date,
    foodId: b.foodId || null,
    name: base.name,
    qty,
    kcal: Math.round(base.kcal * qty),
    protein: Math.round(base.protein * qty * 10) / 10,
    carbs: Math.round(base.carbs * qty * 10) / 10,
    fat: Math.round(base.fat * qty * 10) / 10,
    createdAt: new Date(),
  };

  const res = await db.collection("log").insertOne(doc);
  return NextResponse.json(out({ _id: res.insertedId, ...doc }), { status: 201 });
}
