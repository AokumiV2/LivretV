import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "livretv_session";
const DUREE_JOURS = 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    // Sans secret configuré, on refuse de signer : mieux vaut pas de session
    // du tout qu'une session signée avec une clé devinable.
    throw new Error(
      "AUTH_SECRET manquant ou trop court. Génère-le avec : openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(s);
}

export const authConfiguree = Boolean(
  process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16
);

export type SessionPayload = { sub: string; email: string; pseudo: string };

export async function creerSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${DUREE_JOURS}d`)
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_JOURS * 24 * 60 * 60
  });
}

export async function lireSession(): Promise<SessionPayload | null> {
  if (!authConfiguree) return null;
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      pseudo: String(payload.pseudo ?? "")
    };
  } catch {
    // Jeton expiré, altéré, ou secret changé depuis son émission.
    return null;
  }
}

export function detruireSession() {
  cookies().delete(COOKIE);
}
