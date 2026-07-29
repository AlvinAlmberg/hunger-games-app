import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

// Skyddar:
//  - Alla /admin/*-sidor (redirect till /login om ej inloggad). Inloggningssidan
//    ligger medvetet UTANFÖR /admin (på /login) så den slipper admin-layoutens
//    navigering/utloggningsknapp och inte riskerar att räknas som skyddad.
//  - Rena admin-API:er (games, participants, missions, weapons) — alla metoder
//  - /api/events/:id (PATCH/DELETE = redigera/ångra kill-event) — endast admin
//
// OBS: /api/events (GET/POST) skyddas INTE här, eftersom deltagare måste kunna
// polla och självrapportera sin egen död utan admin-session. Den routen gör sin
// egen behörighetskontroll internt (participant-token för self, admin-session
// för admin-rapporterade kills).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const session = await getSession(req);
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const isAdminApi =
    pathname.startsWith("/api/games") ||
    pathname.startsWith("/api/participants") ||
    pathname.startsWith("/api/missions") ||
    pathname.startsWith("/api/weapons") ||
    /^\/api\/events\/[^/]+$/.test(pathname); // /api/events/:id, ej /api/events självt

  if (isAdminApi) {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Ej inloggad som admin" }, { status: 401 });
    }
    // Skicka vidare vem som är inloggad till route-handlern via header,
    // så den slipper lita på ett adminId skickat i request-body.
    const headers = new Headers(req.headers);
    headers.set("x-admin-id", session.adminId);
    headers.set("x-admin-email", session.email);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

async function getSession(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyAdminSession(token);
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/games/:path*",
    "/api/participants/:path*",
    "/api/missions/:path*",
    "/api/weapons/:path*",
    "/api/events/:path*",
  ],
};
