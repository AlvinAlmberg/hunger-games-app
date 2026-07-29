import { SignJWT, jwtVerify } from "jose";

// Deltagarnas QR-kod kodar INTE bara ett löpnummer — den kodar en signerad token
// (JWT) som pekar på participantId. Det gör den ogissbar och omöjlig att förfalska
// utan hemligheten, vilket förhindrar att någon kommer åt en annan deltagares vy
// eller admin-panelen genom att gissa en URL.

function getSecret() {
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) throw new Error("QR_TOKEN_SECRET saknas i miljövariabler");
  return new TextEncoder().encode(secret);
}

export async function signParticipantToken(participantId: string, gameId: string) {
  return new SignJWT({ participantId, gameId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyParticipantToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as { participantId: string; gameId: string };
}

// TODO (fas 2): motsvarande signerings-/verifieringsfunktioner för ADMIN_SESSION_SECRET
// när admin-inloggning (email + lösenord eller magic link) implementeras.
