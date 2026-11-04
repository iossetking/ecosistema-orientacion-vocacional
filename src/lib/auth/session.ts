import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/types/matrix";

export const SESSION_COOKIE = "eov_session";
const ALG = "HS256";

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET no configurada o demasiado corta (mínimo 16 caracteres)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, dependency: user.dependency })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function verifySessionToken(
  token: string | null | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (typeof payload.name !== "string" || typeof payload.dependency !== "string") return null;
    return { name: payload.name, dependency: payload.dependency };
  } catch {
    return null;
  }
}
