"use client";

import { Input } from "@/components/ui/input";
import type { GraphMode } from "@/lib/analysis/graph-builder";

const MODES: { key: GraphMode; label: string }[] = [
  { key: "stages", label: "Por etapas" },
  { key: "dependencies", label: "Por dependencias" },
  { key: "full", label: "Ecosistema completo" },
];

export default function GraphControls({
  mode,
  onModeChange,
  search,
  onSearchChange,
}: {
  mode: GraphMode;
  onModeChange: (mode: GraphMode) => void;
  search: string;
  onSearchChange: (search: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-lg border bg-white p-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onModeChange(m.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === m.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Input
        placeholder="Buscar registro en el grafo…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
    </div>
  );
}
