import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-jwt";

export async function GET(req: NextRequest) {
  const user = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  }
  const token = await createSupabaseAccessToken();
  return NextResponse.json({ token });
}
