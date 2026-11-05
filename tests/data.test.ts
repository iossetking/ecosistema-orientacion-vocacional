import { describe, expect, it } from "vitest";
import { rowToRecord, type RecordRow } from "@/lib/data";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  dimension_id: 3,
  primary_stage_id: 2,
  related_stage_ids: [3],
  description: "Descripción",
  status: "existe_y_funciona",
  datos: null,
  action_name: "Test vocacional",
  action_type_id: "22222222-2222-4222-8222-222222222222",
  organizer: "SEMS",
  executor: "Preparatorias",
  modality_id: "33333333-3333-4333-8333-333333333333",
  created_by_name: "Ana",
  created_by_dependency: "CGAI",
  updated_by_name: "Carlos",
  updated_by_dependency: "SEMS",
  created_at: "2026-11-03T10:15:00Z",
  updated_at: "2026-11-03T11:40:00Z",
} as unknown as RecordRow;

describe("rowToRecord", () => {
  it("convierte una fila de BD a MatrixRecord conservando dependencias previas", () => {
    const record = rowToRecord(row, ["44444444-4444-4444-8444-444444444444"]);
    expect(record.id).toBe(row.id);
    expect(record.status).toBe("existe_y_funciona");
    expect(record.dependency_ids).toEqual(["44444444-4444-4444-8444-444444444444"]);
  });

  it("usa lista vacía cuando no hay dependencias previas", () => {
    expect(rowToRecord(row).dependency_ids).toEqual([]);
  });

  it("acepta filas parciales de eventos realtime", () => {
    expect(rowToRecord({ ...row, action_name: null }).action_name).toBeNull();
  });
});
