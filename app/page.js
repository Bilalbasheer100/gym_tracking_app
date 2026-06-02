"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Ring from "@/components/Ring";
import MacroBar from "@/components/MacroBar";
import { api, round } from "@/lib/api";
import { todayStr, prettyDate } from "@/lib/date";

export default function Dashboard() {
  const [settings, setSettings] = useState(null);
  const [log, setLog] = useState({ entries: [], totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 } });
  const [favorites, setFavorites] = useState([]);
  const [weights, setWeights] = useState([]);
  const [lastWorkout, setLastWorkout] = useState({ date: null, entries: [] });
  const [busy, setBusy] = useState(true);
  const date = todayStr();

  const load = useCallback(async () => {
    const [s, l, f, w, wo] = await Promise.all([
      api.get("/api/settings"),
      api.get(`/api/log?date=${date}`),
      api.get("/api/foods?favorite=1"),
      api.get("/api/weight"),
      api.get("/api/workouts?recent=1"),
    ]);
    setSettings(s);
    setLog(l);
    setFavorites(f);
    setWeights(w);
    setLastWorkout(wo);
    setBusy(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function quickAdd(food) {
    await api.post("/api/log", { foodId: food.id, qty: 1, date });
    setLog(await api.get(`/api/log?date=${date}`));
  }

  if (busy || !settings) return <Skeleton />;

  const t = log.totals;
  const proteinLeft = Math.max(round(settings.protein - t.protein), 0);
  const calLeft = Math.max(round(settings.calories - t.kcal), 0);
  const unit = settings.unit || "kg";

  const latest = weights[weights.length - 1];
  const prior = weights.length > 1 ? weights[weights.length - 2] : null;
  const wChange = latest && prior ? round(latest.weight - prior.weight, 1) : null;

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">{prettyDate(date)}</p>
          <h1 className="text-2xl font-bold">Today</h1>
        </div>
        <Link href="/food" className="btn-primary">
          + Log food
        </Link>
      </header>

      {/* Calories + macros */}
      <section className="card p-5">
        <div className="flex items-center gap-5">
          <Ring value={t.kcal} goal={settings.calories} color="#4f8cff">
            <span className="text-3xl font-bold leading-none">{round(t.kcal)}</span>
            <span className="text-[11px] text-muted">of {settings.calories} kcal</span>
            <span className="mt-1 text-[11px] font-medium text-good">{calLeft} left</span>
          </Ring>
          <div className="flex-1 space-y-3">
            <MacroBar label="Protein" value={t.protein} goal={settings.protein} color="#ff5d73" />
            <MacroBar label="Carbs" value={t.carbs} goal={settings.carbs} color="#ffb020" />
            <MacroBar label="Fat" value={t.fat} goal={settings.fat} color="#9b6bff" />
          </div>
        </div>
        {proteinLeft > 0 && (
          <p className="mt-4 rounded-xl bg-surface2 px-3 py-2 text-sm">
            💪 <span className="font-semibold text-protein">{proteinLeft}g protein</span> to hit your
            goal.
          </p>
        )}
      </section>

      {/* Quick add favorites */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Quick add</h2>
          <Link href="/food" className="text-xs text-accent">
            manage
          </Link>
        </div>
        {favorites.length === 0 ? (
          <p className="text-sm text-muted">
            Star your go-to meals (like “protein oats”) on the{" "}
            <Link href="/food" className="text-accent">
              Food
            </Link>{" "}
            page for one-tap logging.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map((f) => (
              <button key={f.id} className="chip" onClick={() => quickAdd(f)}>
                <span>{f.name}</span>
                <span className="text-muted">{f.kcal}kcal</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Bodyweight + last workout */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/weight" className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-muted">Bodyweight</h2>
          {latest ? (
            <>
              <p className="text-2xl font-bold">
                {latest.weight}
                <span className="ml-1 text-sm font-medium text-muted">{unit}</span>
              </p>
              {wChange != null && (
                <p className={`text-xs ${wChange <= 0 ? "text-good" : "text-protein"}`}>
                  {wChange > 0 ? "+" : ""}
                  {wChange} {unit} vs last
                </p>
              )}
              <Spark data={weights.slice(-12).map((w) => w.weight)} />
            </>
          ) : (
            <p className="text-sm text-muted">No weigh-ins yet</p>
          )}
        </Link>

        <Link href="/workout" className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-muted">Last workout</h2>
          {lastWorkout.date ? (
            <>
              <p className="text-xs text-muted">{prettyDate(lastWorkout.date)}</p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {lastWorkout.entries.slice(0, 4).map((e) => (
                  <li key={e.id} className="flex justify-between gap-2">
                    <span className="truncate">{e.exercise}</span>
                    <span className="shrink-0 text-muted">{e.sets.length}×</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted">No workouts yet</p>
          )}
        </Link>
      </div>
    </div>
  );
}

// Tiny inline sparkline.
function Spark({ data }) {
  if (!data || data.length < 2) return null;
  const w = 120,
    h = 32,
    pad = 3;
  const min = Math.min(...data),
    max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#4f8cff" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-surface2" />
      <div className="h-48 animate-pulse rounded-2xl bg-surface2" />
      <div className="h-28 animate-pulse rounded-2xl bg-surface2" />
    </div>
  );
}
