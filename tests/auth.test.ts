import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE, createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-jwt";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { shouldProtectPath } from "@/lib/auth/protect";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sesión firmada (jose HS256)", () => {
  it("crea y verifica un token de sesión", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const token = await createSessionToken({ name: "Ana García", dependency: "CGAI" });
    expect(typeof token).toBe("string");
    const user = await verifySessionToken(token);
    expect(user).toEqual({ name: "Ana García", dependency: "CGAI" });
  });

  it("regresa null con token alterado o vacío", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    expect(await verifySessionToken(null)).toBeNull();
    const token = await createSessionToken({ name: "Ana", dependency: "SEMS" });
    expect(await verifySessionToken(`${token}x`)).toBeNull();
  });

  it("regresa null si la firma proviene de otro secreto", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const token = await createSessionToken({ name: "Ana", dependency: "SEMS" });
    vi.stubEnv("SESSION_SECRET", "y".repeat(32));
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("expone el nombre de la cookie", () => {
    expect(SESSION_COOKIE).toBe("eov_session");
  });
});

describe("JWT de Supabase para Realtime", () => {
  it("firma un JWT decodificable con rol authenticated", async () => {
    vi.stubEnv("SUPABASE_JWT_SECRET", "jwt-secret-de-prueba-1234567890");
    const token = await createSupabaseAccessToken();
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    expect(payload.role).toBe("authenticated");
    expect(typeof payload.exp).toBe("number");
  });

  it("lanza error sin SUPABASE_JWT_SECRET", async () => {
    vi.stubEnv("SUPABASE_JWT_SECRET", "");
    await expect(createSupabaseAccessToken()).rejects.toThrow();
  });
});

describe("rate limiter", () => {
  it("permite hasta el límite y bloquea después", () => {
    const key = "pin:test";
    resetRateLimit(key);
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, 5, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("reinicia la ventana cuando expira", () => {
    const key = "pin:expired";
    resetRateLimit(key);
    const now = Date.now();
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000, now);
    const after = checkRateLimit(key, 5, 60_000, now + 61_000);
    expect(after.allowed).toBe(true);
  });
});

describe("shouldProtectPath", () => {
  it("protege rutas de la app", () => {
    expect(shouldProtectPath("/")).toBe(true);
    expect(shouldProtectPath("/analisis")).toBe(true);
    expect(shouldProtectPath("/catalogos")).toBe(true);
  });
  it("no protege acceso ni auth ni estáticos", () => {
    expect(shouldProtectPath("/acceso")).toBe(false);
    expect(shouldProtectPath("/api/auth/pin")).toBe(false);
    expect(shouldProtectPath("/_next/static/app.js")).toBe(false);
    expect(shouldProtectPath("/favicon.ico")).toBe(false);
  });
});
