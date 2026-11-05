import { describe, expect, it } from "vitest";
import { buildGraph, filterRecords } from "@/lib/analysis/graph-builder";
import type { MatrixRecord } from "@/types/matrix";

const r = (id: string, over?: Partial<MatrixRecord>): MatrixRecord => ({
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
  r("a", { primary_stage_id: 1, related_stage_ids: [2], dependency_ids: ["SEMS-ID"] }),
  r("b", { primary_stage_id: 2, dependency_ids: ["SEMS-ID", "CGAI-ID"] }),
  r("c", { primary_stage_id: 5, dependency_ids: [] }),
];

describe("filterRecords", () => {
  it("filtra por etapa (principal o relacionada)", () => {
    expect(filterRecords(records, { stageIds: [2] }).map((x) => x.id)).toEqual(["a", "b"]);
  });
  it("filtra por estado", () => {
    expect(filterRecords(records, { statusKeys: ["sin_clasificar"] })).toHaveLength(3);
    expect(filterRecords(records, { statusKeys: ["existe_y_funciona"] })).toHaveLength(0);
  });
  it("filtra por texto", () => {
    expect(filterRecords(records, { search: "registro b" }).map((x) => x.id)).toEqual(["b"]);
  });
  it("filtra por dependencia", () => {
    expect(filterRecords(records, { dependencyIds: ["CGAI-ID"] }).map((x) => x.id)).toEqual(["b"]);
  });
});

describe("buildGraph", () => {
  it("modo stages: nodos de registro + hubs de etapa con aristas", () => {
    const { nodes, edges } = buildGraph(records, "stages");
    expect(nodes.filter((n) => n.kind === "record")).toHaveLength(3);
    expect(nodes.filter((n) => n.kind === "stage").map((n) => n.id).sort()).toEqual([
      "s:1",
      "s:2",
      "s:5",
    ]);
    expect(edges.filter((e) => e.kind === "stage")).toHaveLength(4);
  });

  it("modo dependencies: hubs de dependencia y aristas registro→dependencia", () => {
    const { nodes, edges } = buildGraph(records, "dependencies");
    expect(nodes.filter((n) => n.kind === "dependency").map((n) => n.id).sort()).toEqual([
      "d:CGAI-ID",
      "d:SEMS-ID",
    ]);
    expect(edges.filter((e) => e.kind === "dependency")).toHaveLength(3);
  });

  it("modo full: contiene hubs de etapas y dependencias", () => {
    const { nodes } = buildGraph(records, "full");
    expect(nodes.some((n) => n.kind === "stage")).toBe(true);
    expect(nodes.some((n) => n.kind === "dependency")).toBe(true);
  });

  it("los nodos de registro llevan color de estado", () => {
    const { nodes } = buildGraph([r("x", { status: "existe_y_funciona" })], "stages");
    const recordNode = nodes.find((n) => n.kind === "record");
    expect(recordNode?.statusColor).toBe("#10b981");
  });

  it("no crea hubs de dependencia sin vínculos", () => {
    const { nodes } = buildGraph([r("c")], "dependencies");
    expect(nodes.filter((n) => n.kind === "dependency")).toHaveLength(0);
  });
});
