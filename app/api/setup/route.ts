import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/admin-auth";

// POST /api/setup — skapar det ALLRA FÖRSTA admin-kontot.
// Motivering: utan detta krävs terminalåtkomst (npm run create-admin) för att
// någonsin kunna logga in, vilket är ett stort hinder för icke-tekniska
// användare som deployar via Vercel/GitHub istället för lokalt.
//
// Säkerhet: denna route fungerar ENDAST om det inte redan finns någon
// AdminUser i databasen. Så fort ett admin-konto finns är routen permanent
// avstängd (403) — den kan alltså inte missbrukas för att skapa fler
// obehöriga admin-konton senare.
export async function POST(req: NextRequest) {
  const existingCount = await db.adminUser.count();
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Installationen är redan klar — det finns redan ett admin-konto." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "E-post och lösenord krävs" }, { status: 400 });
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: "Lösenordet måste vara minst 8 tecken" }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password);
  await db.adminUser.create({ data: { email: body.email, passwordHash } });

  return NextResponse.json({ ok: true });
}

// GET /api/setup — talar om för /setup-sidan om installationen redan är klar,
// så den kan visa rätt läge istället för att låta någon försöka igen i onödan.
export async function GET() {
  const existingCount = await db.adminUser.count();
  return NextResponse.json({ alreadySetUp: existingCount > 0 });
}
