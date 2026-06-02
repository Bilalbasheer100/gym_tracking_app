import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { toObjectId, out } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const _id = toObjectId(params.id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const b = await request.json();
  const set = {};
  if (b.exercise != null) set.exercise = String(b.exercise).trim();
  if (b.note != null) set.note = String(b.note).trim();
  if (Array.isArray(b.sets)) {
    set.sets = b.sets
      .map((s) => ({
        reps: Math.max(0, Math.round(Number(s.reps) || 0)),
        weight: Math.max(0, Number(s.weight) || 0),
      }))
      .filter((s) => s.reps > 0 || s.weight > 0);
  }
  const db = await getDb();
  await db.collection("workouts").updateOne({ _id }, { $set: set });
  const doc = await db.collection("workouts").findOne({ _id });
  return NextResponse.json(out(doc));
}

export async function DELETE(request, { params }) {
  const _id = toObjectId(params.id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const db = await getDb();
  await db.collection("workouts").deleteOne({ _id });
  return new NextResponse(null, { status: 204 });
}
