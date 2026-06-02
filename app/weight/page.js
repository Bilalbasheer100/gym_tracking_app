"use client";
import { useEffect, useState, useCallback } from "react";
import { api, round } from "@/lib/api";
import { todayStr, prettyDate } from "@/lib/date";

export default function WeightPage() {
  const [weights, setWeights] = useState([]);
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState(todayStr());
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [w, s] = await Promise.all([api.get("/api/weight"), api.get("/api/settings")]);
    setWeights(w);
    setUnit(s.unit || "kg");
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e) {
    e.preventDefault();
    setErr("");
    if (!value) return setErr("Enter your weight");
    try {
      await api.post("/api/weight", { date, weight: Number(value) });
      setValue("");
      load();
    } catch (e) {
      setErr(e.message);
    }
  }
  async function remove(id) {
    await api.del(`/api/weight/${id}`);
    load();
  }

  const reversed = [...weights].reverse();
  const latest = weights[weights.length - 1];
  const first = weights[0];
  const total = latest && first ? round(latest.weight - first.weight, 1) : null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Bodyweight</h1>

      <section className="card p-4">
        <form onSubmit={add} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="w-28">
            <label className="label">Weight ({unit})</label>
            <input
              type="number"
              inputMode="decimal"
              className="input text-center"
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <button className="btn-primary">Save</button>
        </form>
        {err && <p className="mt-2 text-sm text-protein">{err}</p>}
      </section>

      {weights.length > 0 && (
        <section className="card p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-sm text-muted">Latest</p>
              <p className="text-3xl font-bold">
                {latest.weight}
                <span className="ml-1 text-base font-medium text-muted">{unit}</span>
              </p>
            </div>
            {total != null && weights.length > 1 && (
              <div className="text-right">
                <p className="text-sm text-muted">Since start</p>
                <p className={`text-xl font-bold ${total <= 0 ? "text-good" : "text-protein"}`}>
                  {total > 0 ? "+" : ""}
                  {total} {unit}
                </p>
              </div>
            )}
          </div>
          <Chart data={weights} unit={unit} />
        </section>
      )}

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-muted">History</h2>
        {weights.length === 0 ? (
          <p className="card p-4 text-sm text-muted">No weigh-ins yet.</p>
        ) : (
          <ul className="space-y-2">
            {reversed.map((w, i) => {
              const next = reversed[i + 1];
              const diff = next ? round(w.weight - next.weight, 1) : null;
              return (
                <li key={w.id} className="card flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium">
                      {w.weight} {unit}
                    </p>
                    <p className="text-xs text-muted">{prettyDate(w.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {diff != null && diff !== 0 && (
                      <span className={`text-sm ${diff < 0 ? "text-good" : "text-protein"}`}>
                        {diff > 0 ? "+" : ""}
                        {diff}
                      </span>
                    )}
                    <button onClick={() => remove(w.id)} className="text-muted hover:text-protein">
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Chart({ data, unit }) {
  if (data.length < 2) {
    return <p className="text-sm text-muted">Add another weigh-in to see your trend.</p>;
  }
  const W = 320,
    H = 130,
    padX = 8,
    padY = 14;
  const vals = data.map((d) => d.weight);
  const min = Math.min(...vals),
    max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i) => padX + (i / (data.length - 1)) * (W - padX * 2);
  const y = (v) => padY + (1 - (v - min) / span) * (H - padY * 2);
  const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.weight).toFixed(1)}`).join(" ");
  const area = `${padX},${H - padY} ${line} ${W - padX},${H - padY}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4f8cff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#wg)" />
      <polyline points={line} fill="none" stroke="#4f8cff" strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.weight)} r="2.5" fill="#4f8cff" />
      ))}
      <text x={padX} y={11} fill="#8a8a96" fontSize="9">
        {max} {unit}
      </text>
      <text x={padX} y={H - 3} fill="#8a8a96" fontSize="9">
        {min} {unit}
      </text>
    </svg>
  );
}
