import { describe, expect, it } from "vitest";
import {
  STAGES,
  DIMENSIONS,
  STATUSES,
  ACTIONS_DIMENSION_ID,
  getStage,
  getDimension,
  getStatus,
} from "@/constants/matrix-config";

describe("matrix-config", () => {
  it("define exactamente 5 etapas con ids 1..5", () => {
    expect(STAGES).toHaveLength(5);
    expect(STAGES.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it("define exactamente 7 dimensiones con ids 1..7", () => {
    expect(DIMENSIONS).toHaveLength(7);
    expect(DIMENSIONS.map((d) => d.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("define exactamente 6 estados de registro", () => {
    expect(STATUSES).toHaveLength(6);
  });

  it("la dimensión extendida es la 3 (Acciones y recursos actuales)", () => {
    expect(ACTIONS_DIMENSION_ID).toBe(3);
    expect(DIMENSIONS.find((d) => d.id === 3)?.extended).toBe(true);
  });

  it("getStage/getDimension/getStatus regresan definiciones existentes", () => {
    expect(getStage(1)?.key).toBe("etapa_1");
    expect(getDimension(1)?.key).toBe("necesidades");
    expect(getStatus("existe_y_funciona")?.label).toBe("Existe y Funciona");
    expect(getStage(99)).toBeUndefined();
  });
});
