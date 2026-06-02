import { NextResponse } from "next/server";
import { COOKIE, verifySession, authEnabled } from "@/lib/auth";

// Endpoints reachable while signed out. Note: change-password and logout-all are
// deliberately NOT here, so they stay behind the session check.
const PUBLIC_AUTH = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/status",
  "/api/auth/epoch",
];

export async function middleware(request) {
  // No password set -> app stays open.
  if (!authEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const cookieEpoch = await verifySession(request.cookies.get(COOKIE)?.value);
  let authed = cookieEpoch !== null;

  // Signature is valid -> make sure the cookie wasn't issued before the last
  // "log out all devices". The epoch endpoint reads the DB so this stays Edge-safe.
  if (authed) {
    try {
      const res = await fetch(new URL("/api/auth/epoch", request.url), { cache: "no-store" });
      if (res.ok) {
        const { epoch } = await res.json();
        if (cookieEpoch < (Number(epoch) || 1)) authed = false;
      }
    } catch {
      // On a transient epoch-read failure, fall back to the signature check only.
    }
  }

  const isLogin = pathname === "/login";
  const isPublicAuth = PUBLIC_AUTH.includes(pathname);

  if (authed) {
    if (isLogin) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // Not signed in.
  if (isLogin || isPublicAuth) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}

// Run on everything except static assets and PWA files.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons|manifest.webmanifest|sw.js|favicon.ico).*)",
  ],
};
