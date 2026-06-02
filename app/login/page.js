"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [configured, setConfigured] = useState(null); // null = still checking
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setConfigured(!!d.configured))
      .catch(() => setConfigured(true));
  }, []);

  const creating = configured === false;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (creating && password !== confirm) {
      setErr("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Login failed");
      }
      router.replace("/");
      router.refresh();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl">
          🏋️
        </div>
        <h1 className="text-2xl font-bold">Gym Tracker</h1>
        <p className="text-sm text-muted">
          {configured === null
            ? "…"
            : creating
            ? "Create a password to set up your app"
            : "Enter your password to continue"}
        </p>
      </div>

      <form onSubmit={submit} className="card w-full max-w-sm space-y-3 p-5">
        <input
          type="password"
          autoFocus
          autoComplete={creating ? "new-password" : "current-password"}
          className="input"
          placeholder={creating ? "New password" : "Password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {creating && (
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        )}
        {err && <p className="text-sm text-protein">{err}</p>}
        <button className="btn-primary w-full" disabled={busy || configured === null}>
          {busy ? "Please wait…" : creating ? "Create & continue" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
