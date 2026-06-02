"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [s, setS] = useState(null);
  const [saved, setSaved] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  async function logoutAll() {
    if (!confirm("Sign out of every device, including this one?")) return;
    await fetch("/api/auth/logout-all", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    api.get("/api/settings").then(setS);
  }, []);

  if (!s) return <div className="h-40 animate-pulse rounded-2xl bg-surface2" />;

  const set = (k) => (e) => {
    setS({ ...s, [k]: e.target.value });
    setSaved(false);
  };

  const macroCals = Math.round(
    (Number(s.protein) || 0) * 4 + (Number(s.carbs) || 0) * 4 + (Number(s.fat) || 0) * 9
  );

  async function save() {
    const r = await api.put("/api/settings", {
      calories: Number(s.calories),
      protein: Number(s.protein),
      carbs: Number(s.carbs),
      fat: Number(s.fat),
      unit: s.unit,
    });
    setS(r);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Goals</h1>

      <section className="card space-y-4 p-4">
        <div>
          <label className="label">Daily calories (kcal)</label>
          <input
            type="number"
            inputMode="numeric"
            className="input"
            value={s.calories}
            onChange={set("calories")}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ["protein", "Protein (g)", "#ff5d73"],
            ["carbs", "Carbs (g)", "#ffb020"],
            ["fat", "Fat (g)", "#9b6bff"],
          ].map(([k, label, color]) => (
            <div key={k}>
              <label className="label" style={{ color }}>
                {label}
              </label>
              <input
                type="number"
                inputMode="numeric"
                className="input text-center"
                value={s[k]}
                onChange={set(k)}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface2 p-3 text-sm">
          <span className="text-muted">Calories from your macros</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{macroCals} kcal</span>
            <button
              className="text-xs text-accent"
              onClick={() => {
                setS({ ...s, calories: macroCals });
                setSaved(false);
              }}
            >
              use this
            </button>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <label className="label">Weight unit</label>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface2 p-1">
          {["kg", "lb"].map((u) => (
            <button
              key={u}
              onClick={() => {
                setS({ ...s, unit: u });
                setSaved(false);
              }}
              className={`rounded-lg py-2 text-sm font-semibold ${
                s.unit === u ? "bg-accent text-white" : "text-muted"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </section>

      <button className="btn-primary w-full" onClick={save}>
        {saved ? "✓ Saved" : "Save goals"}
      </button>

      <ChangePassword />

      <button className="btn-ghost w-full" onClick={logout}>
        Log out
      </button>

      <button
        className="btn-ghost w-full !text-protein"
        onClick={logoutAll}
      >
        Log out all devices
      </button>

      <p className="px-1 text-center text-xs text-muted">
        Gym Tracker · your personal data is stored in your own MongoDB.
      </p>
    </div>
  );
}

function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (next !== confirm) return setMsg({ ok: false, text: "New passwords don't match" });
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not change password");
      setMsg({ ok: true, text: "Password updated" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="btn-ghost w-full" onClick={() => setOpen(true)}>
        Change password
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Change password</h2>
        <button type="button" className="text-xs text-muted" onClick={() => setOpen(false)}>
          cancel
        </button>
      </div>
      <input
        type="password"
        autoComplete="current-password"
        className="input"
        placeholder="Current password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <input
        type="password"
        autoComplete="new-password"
        className="input"
        placeholder="New password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <input
        type="password"
        autoComplete="new-password"
        className="input"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-good" : "text-protein"}`}>{msg.text}</p>
      )}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
