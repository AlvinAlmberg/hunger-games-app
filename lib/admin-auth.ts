import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// Namnet på cookien som håller admin-sessionen. httpOnly + secure (i produktion)
// så den aldrig är åtkomlig från klient-JS eller skickas över okrypterad anslutning.
export const ADMIN_SESSION_COOKIE = "hg_admin_session";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET saknas i miljövariabler");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
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
