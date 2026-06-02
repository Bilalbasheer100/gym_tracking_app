import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxy to Open Food Facts (free, no API key). We normalise everything to
// "per 100 g" so logging is predictable — log qty 1.5 to mean 150 g.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json([]);

  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?" +
    new URLSearchParams({
      search_terms: q,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "20",
      fields: "product_name,brands,nutriments,serving_size,image_small_url",
    }).toString();

  let data;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "GymTracker/1.0 (personal use)" },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error("upstream");
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "Food search is unavailable right now" }, { status: 502 });
  }

  const results = (data.products || [])
    .map((p) => {
      const n = p.nutriments || {};
      const kcal = Number(n["energy-kcal_100g"]) || 0;
      const protein = Number(n["proteins_100g"]) || 0;
      const carbs = Number(n["carbohydrates_100g"]) || 0;
      const fat = Number(n["fat_100g"]) || 0;
      const name = [p.product_name, p.brands ? `(${p.brands})` : ""].join(" ").trim();
      return {
        name: name.slice(0, 80),
        serving: "100 g",
        kcal: Math.round(kcal),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
        image: p.image_small_url || null,
        source: "off",
      };
    })
    .filter((r) => r.name && (r.kcal || r.protein || r.carbs || r.fat));

  return NextResponse.json(results);
}
