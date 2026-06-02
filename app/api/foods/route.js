import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { outMany, out } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// Saved foods / custom meals (the user's personal library).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const favOnly = searchParams.get("favorite") === "1";
  const q = (searchParams.get("q") || "").trim();

  const filter = {};
  if (favOnly) filter.favorite = true;
  if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

  const db = await getDb();
  const docs = await db
    .collection("foods")
    .find(filter)
    .sort({ favorite: -1, uses: -1, name: 1 })
    .limit(200)
    .toArray();
  return NextResponse.json(outMany(docs));
}

export async function POST(request) {
  const b = await request.json();
  const name = (b.name || "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const doc = {
    name,
    serving: (b.serving || "1 serving").trim(),
    kcal: Math.max(0, Number(b.kcal) || 0),
    protein: Math.max(0, Number(b.protein) || 0),
    carbs: Math.max(0, Number(b.carbs) || 0),
    fat: Math.max(0, Number(b.fat) || 0),
    favorite: !!b.favorite,
    source: b.source || "custom",
    uses: 0,
    createdAt: new Date(),
  };

  const db = await getDb();
  const res = await db.collection("foods").insertOne(doc);
  return NextResponse.json(out({ _id: res.insertedId, ...doc }), { status: 201 });
}
