import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { toObjectId, out } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const _id = toObjectId(params.id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const b = await request.json();

  const set = {};
  for (const k of ["name", "serving"]) if (b[k] != null) set[k] = String(b[k]).trim();
  for (const k of ["kcal", "protein", "carbs", "fat"])
    if (b[k] != null) set[k] = Math.max(0, Number(b[k]) || 0);
  if (b.favorite != null) set.favorite = !!b.favorite;

  const db = await getDb();
  await db.collection("foods").updateOne({ _id }, { $set: set });
  const doc = await db.collection("foods").findOne({ _id });
  return NextResponse.json(out(doc));
}

export async function DELETE(request, { params }) {
  const _id = toObjectId(params.id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const db = await getDb();
  await db.collection("foods").deleteOne({ _id });
  return new NextResponse(null, { status: 204 });
}
