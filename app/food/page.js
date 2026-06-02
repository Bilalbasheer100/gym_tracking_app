"use client";
import { useEffect, useState, useCallback } from "react";
import DateNav from "@/components/DateNav";
import MacroBar from "@/components/MacroBar";
import { api, round } from "@/lib/api";
import { todayStr } from "@/lib/date";

export default function FoodPage() {
  const [date, setDate] = useState(todayStr());
  const [settings, setSettings] = useState(null);
  const [log, setLog] = useState({ entries: [], totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 } });
  const [tab, setTab] = useState("library");
  const [err, setErr] = useState("");

  const reloadLog = useCallback(async (d) => {
    setLog(await api.get(`/api/log?date=${d}`));
  }, []);

  useEffect(() => {
    api.get("/api/settings").then(setSettings);
  }, []);
  useEffect(() => {
    reloadLog(date);
  }, [date, reloadLog]);

  async function addToLog(payload) {
    setErr("");
    try {
      await api.post("/api/log", { ...payload, date });
      await reloadLog(date);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function removeEntry(id) {
    await api.del(`/api/log/${id}`);
    await reloadLog(date);
  }

  const t = log.totals;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Food log</h1>
      <DateNav date={date} onChange={setDate} />

      <section className="card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-3xl font-bold">{round(t.kcal)}</span>
          <span className="text-sm text-muted">
            kcal{settings ? ` / ${settings.calories}` : ""}
          </span>
        </div>
        {settings && (
          <div className="grid grid-cols-3 gap-3">
            <MacroBar label="P" value={t.protein} goal={settings.protein} color="#ff5d73" />
            <MacroBar label="C" value={t.carbs} goal={settings.carbs} color="#ffb020" />
            <MacroBar label="F" value={t.fat} goal={settings.fat} color="#9b6bff" />
          </div>
        )}
      </section>

      {/* Add food */}
      <section className="card p-4">
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-surface2 p-1">
          {[
            ["library", "Favorites"],
            ["search", "Search"],
            ["custom", "Custom"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                tab === k ? "bg-accent text-white" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {err && <p className="mb-3 text-sm text-protein">{err}</p>}

        {tab === "library" && <LibraryTab onAdd={addToLog} />}
        {tab === "search" && <SearchTab onAdd={addToLog} />}
        {tab === "custom" && <CustomTab onAdd={addToLog} onSaved={() => setTab("library")} />}
      </section>

      {/* Today's entries */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-muted">
          Logged ({log.entries.length})
        </h2>
        {log.entries.length === 0 ? (
          <p className="card p-4 text-sm text-muted">Nothing logged yet for this day.</p>
        ) : (
          <ul className="space-y-2">
            {log.entries.map((e) => (
              <li key={e.id} className="card flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {e.name}
                    {e.qty !== 1 && <span className="text-muted"> ×{e.qty}</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {round(e.kcal)} kcal · {round(e.protein)}p {round(e.carbs)}c {round(e.fat)}f
                  </p>
                </div>
                <button
                  onClick={() => removeEntry(e.id)}
                  className="text-muted hover:text-protein"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------- Favorites / library ---------- */
function LibraryTab({ onAdd }) {
  const [foods, setFoods] = useState(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setFoods(await api.get("/api/foods" + (q ? `?q=${encodeURIComponent(q)}` : "")));
  }, [q]);
  useEffect(() => {
    const id = setTimeout(load, 200);
    return () => clearTimeout(id);
  }, [load]);

  async function toggleFav(f) {
    await api.patch(`/api/foods/${f.id}`, { favorite: !f.favorite });
    load();
  }
  async function remove(f) {
    if (!confirm(`Delete "${f.name}" from your library?`)) return;
    await api.del(`/api/foods/${f.id}`);
    load();
  }

  if (foods === null) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-3">
      <input
        className="input"
        placeholder="Filter your saved foods…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {foods.length === 0 ? (
        <p className="text-sm text-muted">
          No saved foods yet. Use the <b>Custom</b> tab to add meals like “Protein oats — 569 kcal,
          78p”.
        </p>
      ) : (
        <ul className="space-y-2">
          {foods.map((f) => (
            <LibraryRow key={f.id} food={f} onAdd={onAdd} onFav={toggleFav} onDelete={remove} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LibraryRow({ food, onAdd, onFav, onDelete }) {
  const [qty, setQty] = useState(1);
  return (
    <li className="rounded-xl bg-surface2 p-3">
      <div className="flex items-center gap-2">
        <button onClick={() => onFav(food)} className="text-lg leading-none" aria-label="Favorite">
          {food.favorite ? "⭐" : "☆"}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{food.name}</p>
          <p className="text-xs text-muted">
            {food.kcal} kcal · {food.protein}p {food.carbs}c {food.fat}f
            <span className="opacity-60"> / {food.serving}</span>
          </p>
        </div>
        <button onClick={() => onDelete(food)} className="text-muted hover:text-protein text-sm">
          ✕
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Stepper value={qty} onChange={setQty} />
        <button className="btn-primary flex-1" onClick={() => onAdd({ foodId: food.id, qty })}>
          Add {qty !== 1 ? `×${qty}` : ""} ({round(food.kcal * qty)} kcal)
        </button>
      </div>
    </li>
  );
}

/* ---------- Search (Open Food Facts) ---------- */
function SearchTab({ onAdd }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function run(e) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setMsg("");
    try {
      const r = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(r);
      if (r.length === 0) setMsg("No matches — try a simpler term, or add it via Custom.");
    } catch (e) {
      setMsg(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={run} className="flex gap-2">
        <input
          className="input"
          placeholder="Search foods (e.g. banana, greek yogurt)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-primary" disabled={loading}>
          {loading ? "…" : "Go"}
        </button>
      </form>
      <p className="text-[11px] text-muted">Values are per 100 g. Enter grams to log.</p>
      {msg && <p className="text-sm text-muted">{msg}</p>}
      <ul className="space-y-2">
        {results.map((r, i) => (
          <SearchRow key={i} item={r} onAdd={onAdd} />
        ))}
      </ul>
    </div>
  );
}

function SearchRow({ item, onAdd }) {
  const [grams, setGrams] = useState(100);
  const factor = (Number(grams) || 0) / 100;
  async function save(addToday) {
    const saved = await api.post("/api/foods", { ...item, favorite: false });
    if (addToday) onAdd({ foodId: saved.id, qty: 1 });
  }
  return (
    <li className="rounded-xl bg-surface2 p-3">
      <p className="font-medium leading-tight">{item.name}</p>
      <p className="text-xs text-muted">
        per 100g: {item.kcal} kcal · {item.protein}p {item.carbs}c {item.fat}f
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            className="input !w-20 !py-2 text-center"
          />
          <span className="text-sm text-muted">g</span>
        </div>
        <button
          className="btn-primary flex-1"
          onClick={() =>
            onAdd({
              name: item.name,
              kcal: item.kcal,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              qty: factor,
            })
          }
        >
          Add ({round(item.kcal * factor)} kcal)
        </button>
        <button className="btn-ghost" onClick={() => save(false)} title="Save to library">
          ☆ Save
        </button>
      </div>
    </li>
  );
}

/* ---------- Custom meal ---------- */
function CustomTab({ onAdd, onSaved }) {
  const empty = { name: "", serving: "1 serving", kcal: "", protein: "", carbs: "", fat: "", favorite: true };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(addToday) {
    if (!f.name.trim()) return;
    setBusy(true);
    try {
      const saved = await api.post("/api/foods", f);
      if (addToday) await onAdd({ foodId: saved.id, qty: 1 });
      setF(empty);
      if (!addToday) onSaved?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Meal name</label>
        <input className="input" placeholder="Protein oats" value={f.name} onChange={set("name")} />
      </div>
      <div>
        <label className="label">Serving label (optional)</label>
        <input className="input" placeholder="1 bowl" value={f.serving} onChange={set("serving")} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          ["kcal", "kcal"],
          ["protein", "P (g)"],
          ["carbs", "C (g)"],
          ["fat", "F (g)"],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="label">{label}</label>
            <input
              type="number"
              inputMode="decimal"
              className="input !px-2 text-center"
              placeholder="0"
              value={f[k]}
              onChange={set(k)}
            />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={f.favorite}
          onChange={(e) => setF({ ...f, favorite: e.target.checked })}
          className="h-4 w-4 accent-accent"
        />
        Add to Quick-add favorites
      </label>
      <div className="flex gap-2">
        <button className="btn-ghost flex-1" disabled={busy} onClick={() => save(false)}>
          Save only
        </button>
        <button className="btn-primary flex-1" disabled={busy} onClick={() => save(true)}>
          Save & add today
        </button>
      </div>
    </div>
  );
}

/* ---------- shared ---------- */
function Stepper({ value, onChange }) {
  const step = (d) => onChange(Math.max(0.25, round(value + d, 2)));
  return (
    <div className="flex items-center gap-1">
      <button className="btn-ghost h-10 w-9 !px-0" onClick={() => step(-0.25)}>
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(Math.max(0.25, Number(e.target.value) || 0.25))}
        className="input !w-14 !px-1 !py-2 text-center"
      />
      <button className="btn-ghost h-10 w-9 !px-0" onClick={() => step(0.25)}>
        +
      </button>
    </div>
  );
}
