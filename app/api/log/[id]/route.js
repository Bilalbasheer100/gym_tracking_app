import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const _id = toObjectId(params.id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const db = await getDb();
  await db.collection("log").deleteOne({ _id });
  return new NextResponse(null, { status: 204 });
}
