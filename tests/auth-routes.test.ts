import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => vi.unstubAllEnvs());

function pinRequest(body: unknown, ip: string) {
  return new NextRequest("http://localhost/api/auth/pin", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });
}

describe("POST /api/auth/pin", () => {
  it("rechaza PIN incorrecto con 401", async () => {
    vi.stubEnv("ACCESS_PIN", "4321");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { POST } = await import("@/app/api/auth/pin/route");
    const res = await POST(pinRequest({ name: "Ana", dependency: "SEMS", pin: "1111" }, "ip-pin-1"));
    expect(res.status).toBe(401);
  });

  it("acepta PIN correcto y setea cookie httpOnly", async () => {
    vi.stubEnv("ACCESS_PIN", "4321");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { POST } = await import("@/app/api/auth/pin/route");
    const res = await POST(pinRequest({ name: "Ana", dependency: "SEMS", pin: "4321" }, "ip-pin-2"));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("eov_session=");
    expect(setCookie).toContain("HttpOnly");
  });

  it("rechaza cuerpo inválido con 400", async () => {
    vi.stubEnv("ACCESS_PIN", "4321");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { POST } = await import("@/app/api/auth/pin/route");
    const res = await POST(pinRequest({ name: "A", dependency: "", pin: "1" }, "ip-pin-3"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/token", () => {
  it("regresa 401 sin cookie de sesión", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    vi.stubEnv("SUPABASE_JWT_SECRET", "jwt-secret-de-prueba-1234567890");
    const { GET } = await import("@/app/api/auth/token/route");
    const res = await GET(new NextRequest("http://localhost/api/auth/token"));
    expect(res.status).toBe(401);
  });

  it("regresa un token con sesión válida", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    vi.stubEnv("SUPABASE_JWT_SECRET", "jwt-secret-de-prueba-1234567890");
    const { createSessionToken } = await import("@/lib/auth/session");
    const token = await createSessionToken({ name: "Ana", dependency: "SEMS" });
    const { GET } = await import("@/app/api/auth/token/route");
    const req = new NextRequest("http://localhost/api/auth/token", {
      headers: { cookie: `eov_session=${token}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string };
    expect(body.token.split(".")).toHaveLength(3);
  });
});
