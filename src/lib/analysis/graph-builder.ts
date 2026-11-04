import { ACTIONS_DIMENSION_ID, getStage, getStatus } from "@/constants/matrix-config";
import type { MatrixRecord, RecordStatus } from "@/types/matrix";

export type GraphMode = "stages" | "dependencies" | "full";

export interface GraphFilters {
  stageIds?: number[];
  dimensionIds?: number[];
  statusKeys?: RecordStatus[];
  dependencyIds?: string[];
  search?: string;
  recordScope?: string;
  scope?: string;
  recordFilter?: string;
  recordType?: string;
  recordKind?: string;
  registroScope?: string;
  registroFilter?: string;
  registroType?: string;
  registroKind?: string;
  dimensionScope?: string;
  view?: string;
  recordView?: string;
  includeActions?: boolean;
  actionsOnly?: boolean;
  normalOnly?: boolean;
  showActions?: boolean;
}

export type GraphNode = {
  id: string;
  kind: "record" | "stage" | "dependency";
  label: string;
  recordId?: string;
  statusKey?: RecordStatus;
  statusColor?: string;
  stageId?: number;
  dimensionId?: number;
  color?: string;
}

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: "stage" | "dependency";
}

function isActionsScope(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
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
    return false;
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
    return true;
  if (s.includes("action") || s.includes("recurso") || s.includes("accion")) return true;
  if (s.includes("normal")) return false;
  return undefined;
}

export function resolveRecordScope(filters: GraphFilters = {}): boolean | undefined {
  const candidates: unknown[] = [
    filters.recordScope,
    filters.scope,
    filters.recordFilter,
    filters.recordType,
    filters.recordKind,
    filters.registroScope,
    filters.registroFilter,
    filters.registroType,
    filters.registroKind,
    filters.dimensionScope,
    filters.view,
    filters.recordView,
  ];
  for (const c of candidates) {
    const r = isActionsScope(c);
    if (r !== undefined) return r;
  }
  if (filters.actionsOnly === true) return true;
  if (filters.normalOnly === true) return false;
  if (filters.showActions !== undefined) return filters.showActions;
  if (filters.includeActions !== undefined) return filters.includeActions;
  return undefined;
}

export function filterRecords(records: MatrixRecord[], filters: GraphFilters = {}): MatrixRecord[] {
  const actionsOnly = resolveRecordScope(filters);
  return records.filter((r) => {
    if (actionsOnly === true) {
      if (r.dimension_id !== ACTIONS_DIMENSION_ID) return false;
    } else if (actionsOnly === false) {
      if (r.dimension_id === ACTIONS_DIMENSION_ID) return false;
    }
    if (filters.stageIds && filters.stageIds.length > 0) {
      const involved = [r.primary_stage_id, ...r.related_stage_ids];
      if (!filters.stageIds.some((s) => involved.includes(s))) return false;
    }
    if (filters.dimensionIds && filters.dimensionIds.length > 0) {
      if (!filters.dimensionIds.includes(r.dimension_id)) return false;
    }
    if (filters.statusKeys && filters.statusKeys.length > 0) {
      if (!filters.statusKeys.includes(r.status)) return false;
    }
    if (filters.dependencyIds && filters.dependencyIds.length > 0) {
      if (!filters.dependencyIds.some((d) => r.dependency_ids.includes(d))) return false;
    }
    if (filters.search && filters.search.trim()) {
      const needle = filters.search.trim().toLowerCase();
      const haystack = `${r.description} ${r.action_name ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function buildGraph(
  records: MatrixRecord[],
  mode: GraphMode,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const stageHubIds = new Set<number>();
  const dependencyHubIds = new Set<string>();

  for (const record of records) {
    nodes.push({
      id: `r:${record.id}`,
      kind: "record",
      label: record.action_name ?? record.description,
      recordId: record.id,
      statusKey: record.status,
      statusColor: getStatus(record.status)?.color,
      stageId: record.primary_stage_id,
      dimensionId: record.dimension_id,
    });

    if (mode === "stages" || mode === "full") {
      const stages = [...new Set([record.primary_stage_id, ...record.related_stage_ids])];
      for (const stageId of stages) {
        stageHubIds.add(stageId);
        edges.push({
          id: `e:r:${record.id}-s:${stageId}`,
          source: `r:${record.id}`,
          target: `s:${stageId}`,
          kind: "stage",
        });
      }
    }

    if (mode === "dependencies" || mode === "full") {
      for (const dependencyId of [...new Set(record.dependency_ids)]) {
        dependencyHubIds.add(dependencyId);
        edges.push({
          id: `e:r:${record.id}-d:${dependencyId}`,
          source: `r:${record.id}`,
          target: `d:${dependencyId}`,
          kind: "dependency",
        });
      }
    }
  }

  for (const stageId of stageHubIds) {
    const stage = getStage(stageId);
    nodes.push({
      id: `s:${stageId}`,
      kind: "stage",
      label: stage?.name ?? `Etapa ${stageId}`,
      stageId,
      color: stage?.color,
    });
  }

  for (const dependencyId of dependencyHubIds) {
    nodes.push({
      id: `d:${dependencyId}`,
      kind: "dependency",
      label: dependencyId,
    });
  }

  return { nodes, edges };
}
