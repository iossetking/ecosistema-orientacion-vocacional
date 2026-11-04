"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEPENDENCY_SEED_NAMES } from "@/constants/matrix-config";

export default function AccesoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dependency, setDependency] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, dependency, pin }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "No se pudo iniciar sesión");
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Ecosistema de Orientación Vocacional
          </h1>
          <p className="text-sm text-slate-500">
            Ingresa tus datos y el PIN de la sesión para colaborar en tiempo real.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ana García"
            required
            minLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dependency">Dependencia</Label>
          <Input
            id="dependency"
            value={dependency}
            onChange={(e) => setDependency(e.target.value)}
            placeholder="Ej. SEMS, CGAI, CSE…"
            list="dependency-options"
            required
          />
          <datalist id="dependency-options">
            {DEPENDENCY_SEED_NAMES.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">PIN de acceso</Label>
          <Input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            minLength={4}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Validando…" : "Ingresar"}
        </Button>
      </form>
    </main>
  );
}
