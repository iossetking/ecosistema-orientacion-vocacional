import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => vi.unstubAllEnvs());

describe("middleware", () => {
  it("redirige a /acceso sin sesión", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { middleware } = await import("@/middleware");
    const res = await middleware(new NextRequest("http://localhost/analisis"));
    expect(res.headers.get("location")).toContain("/acceso?next=%2Fanalisis");
  });

  it("redirige la raíz sin sesión", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { middleware } = await import("@/middleware");
    const res = await middleware(new NextRequest("http://localhost/"));
    expect(res.headers.get("location")).toContain("/acceso");
  });

  it("deja pasar con sesión válida", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { createSessionToken } = await import("@/lib/auth/session");
    const token = await createSessionToken({ name: "Ana", dependency: "SEMS" });
    const { middleware } = await import("@/middleware");
    const req = new NextRequest("http://localhost/catalogos", {
      headers: { cookie: `eov_session=${token}` },
    });
    const res = await middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });

  it("no bloquea /acceso ni /api/auth", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { middleware } = await import("@/middleware");
    expect((await middleware(new NextRequest("http://localhost/acceso"))).headers.get("location")).toBeNull();
    expect(
      (await middleware(new NextRequest("http://localhost/api/auth/pin"))).headers.get("location"),
    ).toBeNull();
  });
});
