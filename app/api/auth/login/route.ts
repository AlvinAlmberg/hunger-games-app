import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, signAdminSession, verifyPassword } from "@/lib/admin-auth";

// POST /api/auth/login — admin-inloggning med e-post + lösenord.
// Sätter en httpOnly session-cookie vid lyckad inloggning.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "E-post och lösenord krävs" }, { status: 400 });
  }

  const admin = await db.adminUser.findUnique({ where: { email: body.email } });
  // Samma felmeddelande oavsett om e-posten finns eller lösenordet är fel,
  // för att inte läcka vilka e-postadresser som är registrerade som admin.
  if (!admin || !(await verifyPassword(body.password, admin.passwordHash))) {
    return NextResponse.json({ error: "Fel e-post eller lösenord" }, { status: 401 });
  }

  const token = await signAdminSession({ adminId: admin.id, email: admin.email });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h, matchar sessionens exp-tid
  });
  return res;
}
