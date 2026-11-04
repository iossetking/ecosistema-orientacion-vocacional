import { getStage, getStatus } from "@/constants/matrix-config";
import type { MatrixRecord, RecordStatus } from "@/types/matrix";

export type GraphMode = "stages" | "dependencies" | "full";

export interface GraphFilters {
  stageIds?: number[];
  dimensionIds?: number[];
  statusKeys?: RecordStatus[];
  dependencyIds?: string[];
  search?: string;
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

export function filterRecords(records: MatrixRecord[], filters: GraphFilters): MatrixRecord[] {
  return records.filter((r) => {
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
      const stages = [record.primary_stage_id, ...record.related_stage_ids];
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
      for (const dependencyId of record.dependency_ids) {
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
