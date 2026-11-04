import { describe, expect, it } from "vitest";
import { buildCreateRow, buildUpdateRow } from "@/lib/records/build-row";
import { CATALOG_TABLES } from "@/lib/catalogs/tables";

const baseInput = {
  dimensionId: 2,
  primaryStageId: 1,
  relatedStageIds: [2],
  description: "Condición socioeconómica",
  status: "requiere_fortalecimiento" as const,
  dependencyIds: ["3f2a1b2c-0000-4000-8000-0000000000aa"],
};

const actionInput = {
  ...baseInput,
  dimensionId: 3,
  actionName: "Taller de decisiones",
  actionTypeId: "3f2a1b2c-0000-4000-8000-0000000000bb",
  organizer: "CGAI",
  executor: "Preparatorias",
  modalityId: "3f2a1b2c-0000-4000-8000-0000000000cc",
};

const user = { name: "Ana", dependency: "CGAI" };

describe("buildCreateRow", () => {
  it("mapea campos base y autoría de creación", () => {
    const row = buildCreateRow(baseInput, user);
    expect(row.dimension_id).toBe(2);
    expect(row.primary_stage_id).toBe(1);
    expect(row.related_stage_ids).toEqual([2]);
    expect(row.status).toBe("requiere_fortalecimiento");
    expect(row.created_by_name).toBe("Ana");
    expect(row.updated_by_dependency).toBe("CGAI");
    expect(row.action_name).toBeNull();
    expect(row.action_type_id).toBeNull();
    expect(row.modality_id).toBeNull();
  });

  it("incluye campos extendidos para dimensión 3", () => {
    const row = buildCreateRow(actionInput, user);
    expect(row.action_name).toBe("Taller de decisiones");
    expect(row.organizer).toBe("CGAI");
    expect(row.modality_id).toBe("3f2a1b2c-0000-4000-8000-0000000000cc");
  });
});

describe("buildUpdateRow", () => {
  it("no incluye campos created_by", () => {
    const row = buildUpdateRow(baseInput, user);
    expect(row).not.toHaveProperty("created_by_name");
    expect(row).not.toHaveProperty("created_by_dependency");
    expect(row.updated_by_name).toBe("Ana");
    expect(row.dimension_id).toBe(2);
  });
});

describe("CATALOG_TABLES", () => {
  it("mapea los tres catálogos a sus tablas", () => {
    expect(CATALOG_TABLES.action_types).toBe("catalog_action_types");
    expect(CATALOG_TABLES.modalities).toBe("catalog_modalities");
    expect(CATALOG_TABLES.dependencies).toBe("catalog_dependencies");
  });
});
