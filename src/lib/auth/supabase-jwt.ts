import { SignJWT } from "jose";

export const PIN_SESSION_SUB = "00000000-0000-4000-8000-000000000000";
const ALG = "HS256";

export async function createSupabaseAccessToken(): Promise<string> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET no configurada");
  }
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(PIN_SESSION_SUB)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(new TextEncoder().encode(secret));
}
