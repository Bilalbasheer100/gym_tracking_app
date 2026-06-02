"use client";
import { useEffect, useState, useCallback } from "react";
import DateNav from "@/components/DateNav";
import { api } from "@/lib/api";
import { todayStr, prettyDate } from "@/lib/date";

export default function WorkoutPage() {
  const [date, setDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [names, setNames] = useState([]);

  const load = useCallback(async () => {
    const [e, n] = await Promise.all([
      api.get(`/api/workouts?date=${date}`),
      api.get("/api/workouts?names=1"),
    ]);
    setEntries(e);
    setNames(n);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id) {
    await api.del(`/api/workouts/${id}`);
    load();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Workout</h1>
      <DateNav date={date} onChange={setDate} />

      <AddExercise date={date} names={names} onSaved={load} />

      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold text-muted">
          {prettyDate(date)} · {entries.length} exercise{entries.length === 1 ? "" : "s"}
        </h2>
        {entries.length === 0 ? (
          <p className="card p-4 text-sm text-muted">No exercises logged for this day yet.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{e.exercise}</p>
                  <button onClick={() => remove(e.id)} className="text-muted hover:text-protein">
                    ✕
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.sets.map((s, i) => (
                    <span key={i} className="chip !py-1 text-xs">
                      {s.weight || 0}×{s.reps}
                    </span>
                  ))}
                </div>
                {e.note && <p className="mt-2 text-xs text-muted">📝 {e.note}</p>}
                <p className="mt-2 text-[11px] text-muted">
                  Volume: {volume(e.sets)} · Top set: {topSet(e.sets)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AddExercise({ date, names, onSaved }) {
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState([{ weight: "", reps: "" }]);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Pull last session of this exercise for the "last time" hint.
  useEffect(() => {
    const name = exercise.trim();
    if (!name) {
      setHistory(null);
      return;
    }
    const id = setTimeout(async () => {
      const h = await api.get(`/api/workouts?exercise=${encodeURIComponent(name)}`);
      const prev = h.find((x) => x.date !== date) || null;
      setHistory(prev);
    }, 300);
    return () => clearTimeout(id);
  }, [exercise, date]);

  function updateSet(i, k, v) {
    setSets((s) => s.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  }
  function addRow() {
    // Pre-fill with the previous row to speed up straight sets.
    const last = sets[sets.length - 1] || { weight: "", reps: "" };
    setSets([...sets, { ...last }]);
  }
  function removeRow(i) {
    setSets((s) => (s.length === 1 ? s : s.filter((_, idx) => idx !== i)));
  }

  async function save() {
    setErr("");
    if (!exercise.trim()) return setErr("Enter an exercise name");
    setBusy(true);
    try {
      await api.post("/api/workouts", { date, exercise: exercise.trim(), sets, note });
      setExercise("");
      setSets([{ weight: "", reps: "" }]);
      setNote("");
      setHistory(null);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card space-y-3 p-4">
      <h2 className="font-semibold">Add exercise</h2>
      <input
        className="input"
        placeholder="Exercise (e.g. Bench Press)"
        value={exercise}
        onChange={(e) => setExercise(e.target.value)}
        list="exercise-names"
      />
      <datalist id="exercise-names">
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {history && (
        <div className="rounded-xl bg-surface2 p-3 text-sm">
          <p className="text-xs font-semibold text-accent">Last time · {prettyDate(history.date)}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {history.sets.map((s, i) => (
              <span key={i} className="chip !py-0.5 text-xs">
                {s.weight || 0}×{s.reps}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-2 px-1 text-[11px] font-medium text-muted">
          <span className="w-7" />
          <span className="flex-1">Weight</span>
          <span className="flex-1">Reps</span>
          <span className="w-8" />
        </div>
        {sets.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-7 text-center text-sm font-semibold text-muted">{i + 1}</span>
            <input
              type="number"
              inputMode="decimal"
              className="input flex-1 text-center"
              placeholder="0"
              value={s.weight}
              onChange={(e) => updateSet(i, "weight", e.target.value)}
            />
            <input
              type="number"
              inputMode="numeric"
              className="input flex-1 text-center"
              placeholder="0"
              value={s.reps}
              onChange={(e) => updateSet(i, "reps", e.target.value)}
            />
            <button
              onClick={() => removeRow(i)}
              className="w-8 text-muted hover:text-protein"
              aria-label="Remove set"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="btn-ghost w-full" onClick={addRow}>
        + Add set
      </button>
      <input
        className="input"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {err && <p className="text-sm text-protein">{err}</p>}
      <button className="btn-primary w-full" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save exercise"}
      </button>
    </section>
  );
}

function volume(sets) {
  return sets.reduce((v, s) => v + (s.weight || 0) * (s.reps || 0), 0);
}
function topSet(sets) {
  let best = null;
  for (const s of sets) if (!best || (s.weight || 0) > (best.weight || 0)) best = s;
  return best ? `${best.weight || 0}×${best.reps}` : "—";
}
