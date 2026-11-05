import { describe, expect, it } from "vitest";
import {
  kpis,
  countByStatus,
  stageStatusSeries,
  heatCells,
  countByDependency,
  actionsByCatalog,
} from "@/lib/analysis/aggregate";
import type { CatalogDependency, MatrixRecord } from "@/types/matrix";

const r = (id: string, over: Partial<MatrixRecord>): MatrixRecord => ({
  id,
  dimension_id: 1,
  primary_stage_id: 1,
  related_stage_ids: [],
  description: `Registro ${id}`,
  status: "sin_clasificar",
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
  dependency_ids: [],
  ...over,
});

const records = [
  r("a", { status: "existe_y_funciona", primary_stage_id: 1 }),
  r("b", { status: "existe_y_funciona", primary_stage_id: 1 }),
  r("c", { status: "requiere_fortalecimiento", primary_stage_id: 2, dimension_id: 5 }),
  r("d", {
    dimension_id: 3,
    primary_stage_id: 2,
    action_type_id: "t1",
    modality_id: "m1",
    dependency_ids: ["dep1"],
  }),
];

const dependencies: CatalogDependency[] = [
  { id: "dep1", name: "SEMS", code: "SEMS", sort_order: 1, is_active: true },
  { id: "dep2", name: "CGAI", code: "CGAI", sort_order: 2, is_active: true },
];

describe("kpis", () => {
  it("calcula totales y porcentajes", () => {
    const k = kpis(records);
    expect(k.total).toBe(4);
    expect(k.workingPct).toBe(50);
    expect(k.strengtheningPct).toBe(25);
    expect(k.gaps).toBe(1);
  });
});

describe("countByStatus", () => {
  it("cuenta por estado incluyendo ceros", () => {
    const counts = countByStatus(records);
    expect(counts.find((c) => c.key === "existe_y_funciona")?.count).toBe(2);
    expect(counts.find((c) => c.key === "sin_clasificar")?.count).toBe(1);
    expect(counts.find((c) => c.key === "no_existe")?.count).toBe(0);
  });
});

describe("stageStatusSeries", () => {
  it("produce una serie por etapa", () => {
    const series = stageStatusSeries(records);
    expect(series).toHaveLength(5);
    const stage1 = series.find((s) => s.stageId === 1);
    expect(stage1?.["Existe y Funciona"]).toBe(2);
    const stage2 = series.find((s) => s.stageId === 2);
    expect(stage2?.["Requiere fortalecimiento o actualización"]).toBe(1);
  });
});

describe("heatCells", () => {
  it("produce celdas etapa × dimensión con conteo", () => {
    const cells = heatCells(records);
    const cell = cells.find((c) => c.stageId === 1 && c.dimensionId === 1);
    expect(cell?.count).toBe(2);
    const missing = cells.find((c) => c.stageId === 5 && c.dimensionId === 7);
    expect(missing?.count ?? 0).toBe(0);
  });
});

describe("countByDependency", () => {
  it("cuenta registros por dependencia", () => {
    const counts = countByDependency(records, dependencies);
    expect(counts.find((c) => c.name === "SEMS")?.count).toBe(1);
    expect(counts.find((c) => c.name === "CGAI")?.count).toBe(0);
  });
});

describe("actionsByCatalog", () => {
  it("agrupa acciones por tipo y por modalidad", () => {
    const types = actionsByCatalog(records, "action_type_id", [
      { id: "t1", name: "Test vocacionales", sort_order: 1, is_active: true },
    ]);
    expect(types.find((t) => t.name === "Test vocacionales")?.count).toBe(1);
    const mods = actionsByCatalog(records, "modality_id", [
      { id: "m1", name: "Presencial", sort_order: 1, is_active: true },
    ]);
    expect(mods.find((m) => m.name === "Presencial")?.count).toBe(1);
  });
});
