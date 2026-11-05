import { describe, expect, it } from "vitest";
import { applyRecordEvent, applyLinkEvent, applyCatalogEvent } from "@/hooks/useRealtimeMatrix";
import type { CatalogDependency, MatrixRecord } from "@/types/matrix";

const base: MatrixRecord = {
  id: "r1",
  dimension_id: 1,
  primary_stage_id: 1,
  related_stage_ids: [],
  description: "Original",
  status: null,
  datos: null,
  action_name: null,
  action_type_id: null,
  organizer: null,
  executor: null,
  modality_id: null,
  created_by_name: "Ana",
  created_by_dependency: "CGAI",
  updated_by_name: "Ana",
  updated_by_dependency: "CGAI",
  created_at: "2026-11-03T10:00:00Z",
  updated_at: "2026-11-03T10:00:00Z",
  dependency_ids: ["d1"],
};

const rowOf = (over: Record<string, unknown>) => ({ ...base, ...over });

describe("applyRecordEvent", () => {
  it("INSERT agrega el registro", () => {
    const out = applyRecordEvent([base], "INSERT", rowOf({ id: "r2", description: "Nuevo" }));
    expect(out).toHaveLength(2);
  });

  it("UPDATE reemplaza el registro y conserva sus dependencias actuales", () => {
    const out = applyRecordEvent([base], "UPDATE", rowOf({ id: "r1", description: "Editado" }));
    expect(out[0].description).toBe("Editado");
    expect(out[0].dependency_ids).toEqual(["d1"]);
  });

  it("DELETE elimina el registro", () => {
    const out = applyRecordEvent([base], "DELETE", { id: "r1" });
    expect(out).toHaveLength(0);
  });
});

describe("applyLinkEvent", () => {
  it("INSERT de vínculo agrega la dependencia al registro", () => {
    const out = applyLinkEvent([base], "INSERT", "r1", "d2");
    expect(out[0].dependency_ids).toEqual(["d1", "d2"]);
  });

  it("DELETE de vínculo quita la dependencia del registro", () => {
    const out = applyLinkEvent([base], "DELETE", "r1", "d1");
    expect(out[0].dependency_ids).toEqual([]);
  });

  it("ignora vínculos de registros desconocidos", () => {
    const out = applyLinkEvent([base], "INSERT", "otro", "d2");
    expect(out[0].dependency_ids).toEqual(["d1"]);
  });
});

describe("applyCatalogEvent", () => {
  const deps: CatalogDependency[] = [
    { id: "d1", name: "SEMS", code: "SEMS", sort_order: 1, is_active: true },
  ];

  it("INSERT agrega ítem", () => {
    const nuevo: CatalogDependency = { id: "d2", name: "CGAI", code: null, sort_order: 2, is_active: true };
    expect(applyCatalogEvent(deps, "INSERT", nuevo)).toHaveLength(2);
  });

  it("UPDATE reemplaza por id", () => {
    const editado = { ...deps[0], name: "SEMS Actualizado" };
    const out = applyCatalogEvent(deps, "UPDATE", editado);
    expect(out[0].name).toBe("SEMS Actualizado");
  });

  it("DELETE elimina por id", () => {
    expect(applyCatalogEvent(deps, "DELETE", { id: "d1" })).toHaveLength(0);
  });
});
