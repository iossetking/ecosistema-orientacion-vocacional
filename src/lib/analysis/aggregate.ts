import { DIMENSIONS, STAGES, STATUSES } from "@/constants/matrix-config";
import type {
  CatalogDependency,
  MatrixRecord,
  RecordStatus,
} from "@/types/matrix";

export interface Kpis {
  total: number;
  workingPct: number;
  strengtheningPct: number;
  gaps: number;
}

export function kpis(records: MatrixRecord[]): Kpis {
  const total = records.length;
  const working = records.filter((r) => r.status === "existe_y_funciona").length;
  const strengthening = records.filter((r) => r.status === "requiere_fortalecimiento").length;
  const gaps = records.filter((r) => r.dimension_id === 5).length;
  return {
    total,
    workingPct: total === 0 ? 0 : Math.round((working / total) * 100),
    strengtheningPct: total === 0 ? 0 : Math.round((strengthening / total) * 100),
    gaps,
  };
}

export function countByStatus(records: MatrixRecord[]): {
  key: RecordStatus;
  label: string;
  color: string;
  count: number;
}[] {
  return STATUSES.map((status) => ({
    key: status.key,
    label: status.label,
    color: status.color,
    count: records.filter((r) => r.status === status.key).length,
  }));
}

export interface StageStatusRow {
  stageId: number;
  stage: string;
  [statusLabel: string]: number | string;
}

export function stageStatusSeries(records: MatrixRecord[]): StageStatusRow[] {
  return STAGES.map((stage) => {
    const row: StageStatusRow = { stageId: stage.id, stage: stage.name };
    for (const status of STATUSES) {
      row[status.label] = records.filter(
        (r) => r.primary_stage_id === stage.id && r.status === status.key,
      ).length;
    }
    return row;
  });
}

export function heatCells(records: MatrixRecord[]): {
  stageId: number;
  dimensionId: number;
  count: number;
}[] {
  const cells: { stageId: number; dimensionId: number; count: number }[] = [];
  for (const stage of STAGES) {
    for (const dimension of DIMENSIONS) {
      const count = records.filter(
        (r) =>
          r.dimension_id === dimension.id &&
          (r.primary_stage_id === stage.id || r.related_stage_ids.includes(stage.id)),
      ).length;
      cells.push({ stageId: stage.id, dimensionId: dimension.id, count });
    }
  }
  return cells;
}

export function countByDependency(
  records: MatrixRecord[],
  dependencies: CatalogDependency[],
): { name: string; count: number }[] {
  return dependencies.map((dependency) => ({
    name: dependency.name,
    count: records.filter((r) => r.dependency_ids.includes(dependency.id)).length,
  }));
}

export function actionsByCatalog(
  records: MatrixRecord[],
  field: "action_type_id" | "modality_id",
  catalog: { id: string; name: string }[],
): { name: string; count: number }[] {
  const actions = records.filter((r) => r.dimension_id === 3);
  return catalog.map((item) => ({
    name: item.name,
    count: actions.filter((r) => r[field] === item.id).length,
  }));
}
