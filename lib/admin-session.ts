import { SignJWT, jwtVerify } from "jose";

// Detta är den EDGE-SÄKRA delen av admin-autentiseringen. middleware.ts körs
// på Vercels Edge Runtime, som inte stödjer alla Node.js-API:er. bcryptjs
// (lösenordshashning) använder sådana API:er (process.nextTick, setImmediate)
// och FÅR DÄRFÖR ALDRIG importeras i en fil som middleware.ts läser — annars
// riskerar hela adminpanelen att krascha på Edge Runtime i produktion.
// Lösenordshashning ligger separat i lib/admin-auth.ts (Node.js runtime, API-routes).

export const ADMIN_SESSION_COOKIE = "hg_admin_session";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET saknas i miljövariabler");
  return new TextEncoder().encode(secret);
}

export type AdminSessionPayload = {
  adminId: string;
  email: string;
};

export async function signAdminSession(payload: AdminSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h") // ett event pågår typiskt en dag — 12h räcker, admin loggar in på nytt vid behov
    .sign(getSecret());
}

export async function verifyAdminSession(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as AdminSessionPayload & { iat: number; exp: number };
}
