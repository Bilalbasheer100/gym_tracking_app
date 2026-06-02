import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { outMany, out } from "@/lib/serialize";
import { todayStr } from "@/lib/date";

export const dynamic = "force-dynamic";

function cleanSets(sets) {
  if (!Array.isArray(sets)) return [];
  return sets
    .map((s) => ({
      reps: Math.max(0, Math.round(Number(s.reps) || 0)),
      weight: Math.max(0, Number(s.weight) || 0),
    }))
    .filter((s) => s.reps > 0 || s.weight > 0);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const db = await getDb();

  // Distinct exercise names for autocomplete.
  if (searchParams.get("names") === "1") {
    const names = await db.collection("workouts").distinct("exercise");
    return NextResponse.json(names.sort((a, b) => a.localeCompare(b)));
  }

  // Most recent training day (for the dashboard "last workout" card).
  if (searchParams.get("recent") === "1") {
    const last = await db
      .collection("workouts")
      .find({})
      .sort({ date: -1, createdAt: -1 })
      .limit(1)
      .toArray();
    if (!last.length) return NextResponse.json({ date: null, entries: [] });
    const date = last[0].date;
    const docs = await db
      .collection("workouts")
      .find({ date })
      .sort({ createdAt: 1 })
      .toArray();
    return NextResponse.json({ date, entries: outMany(docs) });
  }

  // History of a single exercise (newest first) for progression / "last time".
  const exercise = searchParams.get("exercise");
  if (exercise) {
    const docs = await db
      .collection("workouts")
      .find({ exercise })
      .sort({ date: -1, createdAt: -1 })
      .limit(30)
      .toArray();
    return NextResponse.json(outMany(docs));
  }

  // Everything for one day.
  const date = searchParams.get("date") || todayStr();
  const docs = await db
    .collection("workouts")
    .find({ date })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json(outMany(docs));
}

export async function POST(request) {
  const b = await request.json();
  const exercise = (b.exercise || "").trim();
  if (!exercise) return NextResponse.json({ error: "Exercise name is required" }, { status: 400 });
  const sets = cleanSets(b.sets);
  if (!sets.length) return NextResponse.json({ error: "Add at least one set" }, { status: 400 });

  const doc = {
    date: b.date || todayStr(),
    exercise,
    sets,
    note: (b.note || "").trim(),
    createdAt: new Date(),
  };
  const db = await getDb();
  const res = await db.collection("workouts").insertOne(doc);
  return NextResponse.json(out({ _id: res.insertedId, ...doc }), { status: 201 });
}
