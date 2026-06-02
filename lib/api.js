// Tiny client-side fetch wrapper so components stay clean.

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) {
    // Session expired or revoked (e.g. "log out all devices") -> bounce to login.
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (url) => req("GET", url),
  post: (url, body) => req("POST", url, body),
  patch: (url, body) => req("PATCH", url, body),
  put: (url, body) => req("PUT", url, body),
  del: (url) => req("DELETE", url),
};

export function round(n, d = 0) {
  const f = Math.pow(10, d);
  return Math.round((Number(n) || 0) * f) / f;
}
