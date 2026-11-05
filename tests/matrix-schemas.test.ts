import { describe, expect, it } from "vitest";
import {
  baseRecordFormSchema,
  actionRecordFormSchema,
  getRecordFormSchema,
  pinLoginSchema,
  catalogCreateSchema,
} from "@/types/matrix";

const baseValid = {
  dimensionId: 1,
  primaryStageId: 2,
  relatedStageIds: [3],
  description: "Necesidad de orientación temprana",
  dependencyIds: ["3f2a1b2c-0000-4000-8000-000000000001"],
};

const actionExtraValid = {
  status: "sin_clasificar",
  actionName: "Test vocacional industrial",
  actionTypeId: "3f2a1b2c-0000-4000-8000-000000000002",
  organizer: "SEMS",
  executor: "Preparatorias",
  modalityId: "3f2a1b2c-0000-4000-8000-000000000003",
};

describe("esquemas zod de registros", () => {
  it("valida un registro base", () => {
    expect(baseRecordFormSchema.safeParse(baseValid).success).toBe(true);
  });

  it("rechaza descripción vacía", () => {
    expect(baseRecordFormSchema.safeParse({ ...baseValid, description: "   " }).success).toBe(false);
  });

  it("rechaza etapa fuera de rango", () => {
    expect(baseRecordFormSchema.safeParse({ ...baseValid, primaryStageId: 6 }).success).toBe(false);
  });

  it("rechaza estado inválido", () => {
    expect(actionRecordFormSchema.safeParse({ ...baseValid, ...actionExtraValid, status: "aprobado" }).success).toBe(false);
  });

  it("valida registro extendido de dimensión 3", () => {
    expect(actionRecordFormSchema.safeParse({ ...baseValid, ...actionExtraValid }).success).toBe(true);
  });

  it("rechaza registro extendido sin nombre de acción", () => {
    const { actionName, ...rest } = actionExtraValid;
    void actionName;
    expect(actionRecordFormSchema.safeParse({ ...baseValid, ...rest }).success).toBe(false);
  });

  it("getRecordFormSchema exige campos extendidos solo para dimensión 3", () => {
    expect(getRecordFormSchema(3).safeParse(baseValid).success).toBe(false);
    expect(getRecordFormSchema(1).safeParse(baseValid).success).toBe(true);
  });
});

describe("pinLoginSchema", () => {
  it("requiere nombre, dependencia y pin", () => {
    expect(pinLoginSchema.safeParse({ name: "Ana", dependency: "SEMS", pin: "1234" }).success).toBe(true);
    expect(pinLoginSchema.safeParse({ name: "A", dependency: "SEMS", pin: "1234" }).success).toBe(false);
    expect(pinLoginSchema.safeParse({ name: "Ana", dependency: "", pin: "1234" }).success).toBe(false);
  });
});

describe("catalogCreateSchema", () => {
  it("requiere nombre no vacío", () => {
    expect(catalogCreateSchema.safeParse({ name: " Test " }).success).toBe(true);
    expect(catalogCreateSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
