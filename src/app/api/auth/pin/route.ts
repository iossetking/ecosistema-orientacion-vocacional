import { NextRequest, NextResponse } from "next/server";
import { pinLoginSchema } from "@/types/matrix";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rate = checkRateLimit(`pin:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = pinLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos incompletos" },
      { status: 400 },
    );
  }

  const expected = process.env.ACCESS_PIN;
  if (!expected) {
    return NextResponse.json({ error: "Servidor sin ACCESS_PIN configurado" }, { status: 500 });
  }
  if (parsed.data.pin !== expected) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const token = await createSessionToken({
    name: parsed.data.name,
    dependency: parsed.data.dependency,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
