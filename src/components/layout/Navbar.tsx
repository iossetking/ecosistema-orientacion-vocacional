"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/types/matrix";
import type { ConnectionStatus } from "@/hooks/useRealtimeMatrix";

const TABS = [
  { href: "/", label: "Matriz" },
  { href: "/analisis", label: "Análisis" },
  { href: "/catalogos", label: "Catálogos" },
  { href: "/exportar", label: "Exportar" },
];

export default function Navbar({
  user,
  connection,
}: {
  user: SessionUser | null;
  connection: ConnectionStatus;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/acceso");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold tracking-tight text-slate-900">Ecosistema Vocacional</h1>
        {pathname !== "/acceso" ? (
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-xs">
        {pathname !== "/acceso" ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
              connection === "live"
                ? "bg-emerald-50 text-emerald-700"
                : connection === "connecting"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                connection === "live"
                  ? "bg-emerald-500"
                  : connection === "connecting"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
            />
            {connection === "live"
              ? "Sincronización en vivo"
              : connection === "connecting"
                ? "Conectando…"
                : "Sin conexión"}
          </span>
        ) : null}
        {user ? (
          <span className="text-slate-600">
            {user.name} · {user.dependency}
          </span>
        ) : null}
        {pathname !== "/acceso" ? (
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-600 transition hover:bg-slate-100"
          >
            Salir
          </button>
        ) : null}
      </div>
    </header>
  );
}
