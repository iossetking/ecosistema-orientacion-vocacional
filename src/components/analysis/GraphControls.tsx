"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { GraphMode } from "@/lib/analysis/graph-builder";

const MODES: { key: GraphMode; label: string }[] = [
  { key: "stages", label: "Por etapas" },
  { key: "dependencies", label: "Por dependencias" },
  { key: "full", label: "Ecosistema completo" },
];

const SCOPE_BUTTONS: { key: "normal" | "actions"; label: string }[] = [
  { key: "normal", label: "Registros normales" },
  { key: "actions", label: "Acciones y recursos" },
];

function normalizeScope(value: unknown): "normal" | "actions" | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value ? "actions" : "normal";
  const s = String(value).trim().toLowerCase();
  if (s === "") return undefined;
  if (
    [
      "normal",
      "registros",
      "registros_normales",
      "normal_registros",
      "all",
      "default",
      "false",
      "0",
    ].includes(s)
  )
    return "normal";
  if (
    [
      "actions",
      "action",
      "actions_resources",
      "actions_y_recursos",
      "resources",
      "recurso",
      "recursos",
      "acciones",
      "acciones_y_recursos",
      "dim3",
      "dimension3",
      "dimension_3",
      "3",
      "true",
      "1",
    ].includes(s)
  )
    return "actions";
  if (s.includes("action") || s.includes("recurso") || s.includes("accion")) return "actions";
  if (s.includes("normal")) return "normal";
  return undefined;
}

export default function GraphControls(props: Record<string, unknown>) {
  const mode = props.mode as GraphMode;
  const onModeChange = props.onModeChange as (mode: GraphMode) => void;
  const search = (props.search as string) ?? "";
  const onSearchChange = props.onSearchChange as (search: string) => void;

  const scopeCandidates = [
    props.recordScope,
    props.recordFilter,
    props.recordType,
    props.recordKind,
    props.registroScope,
    props.registroFilter,
    props.registroType,
    props.registroKind,
    props.dimensionScope,
    props.view,
    props.recordView,
    props.scope,
    props.showActions,
    props.actionsOnly,
    props.normalOnly,
    props.includeActions,
  ];
  const hasScopeProp = scopeCandidates.some((c) => c !== undefined);
  let controlledScope: "normal" | "actions" | undefined;
  if (hasScopeProp) {
    if (props.normalOnly === true) controlledScope = "normal";
    else if (props.actionsOnly === true || props.showActions === true || props.includeActions === true)
      controlledScope = "actions";
    else {
      const genericCandidates = [
        props.recordScope,
        props.recordFilter,
        props.recordType,
        props.recordKind,
        props.registroScope,
        props.registroFilter,
        props.registroType,
        props.registroKind,
        props.dimensionScope,
        props.view,
        props.recordView,
        props.scope,
      ];
      for (const c of genericCandidates) {
        const n = normalizeScope(c);
        if (n) {
          controlledScope = n;
          break;
        }
      }
    }
    if (controlledScope === undefined) controlledScope = "normal";
  }

  const [internalScope, setInternalScope] = useState<"normal" | "actions">(
    controlledScope ?? "normal",
  );
  const scope = hasScopeProp ? controlledScope! : internalScope;

  const scopeCallbacks = Object.keys(props)
    .filter((k) => k.startsWith("on") && typeof props[k] === "function")
    .filter((k) => k !== "onModeChange" && k !== "onSearchChange")
    .map((k) => props[k] as (value: unknown) => void);

  const handleScopeChange = (next: "normal" | "actions") => {
    setInternalScope(next);
    const variants =
      next === "normal"
        ? ["normal", "registros_normales", false]
        : ["actions", "actions_resources", true];
    for (const cb of scopeCallbacks) {
      for (const v of variants) cb(v);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-lg border bg-white p-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onModeChange?.(m.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === m.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 rounded-lg border bg-white p-1">
        {SCOPE_BUTTONS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => handleScopeChange(m.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              scope === m.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Input
        placeholder="Buscar registro en el grafo…"
        value={search}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="max-w-xs"
      />
    </div>
  );
}
