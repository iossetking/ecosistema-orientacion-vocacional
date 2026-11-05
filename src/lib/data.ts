import { getServerSupabase } from "@/lib/supabase/server";
import type { CatalogDependency, MatrixRecord, MatrixSnapshot, RecordStatus } from "@/types/matrix";

export interface RecordRow {
  id: string;
  dimension_id: number;
  primary_stage_id: number;
  related_stage_ids: number[];
  description: string;
  status: RecordStatus | null;
  action_name: string | null;
  action_type_id: string | null;
  organizer: string | null;
  executor: string | null;
  modality_id: string | null;
  created_by_name: string;
  created_by_dependency: string;
  updated_by_name: string;
  updated_by_dependency: string;
  created_at: string;
  updated_at: string;
}

export interface LinkRow {
  record_id: string;
  dependency_id: string;
}

export function rowToRecord(row: RecordRow, previousDependencyIds: string[] = []): MatrixRecord {
  return { ...row, dependency_ids: previousDependencyIds };
}

export async function getMatrixSnapshot(): Promise<MatrixSnapshot> {
  const sb = getServerSupabase();
  const [recordsRes, linksRes, actionTypesRes, modalitiesRes, dependenciesRes] = await Promise.all([
    sb.from("matrix_records").select("*"),
    sb.from("record_dependencies").select("record_id, dependency_id"),
    sb.from("catalog_action_types").select("*").order("sort_order"),
    sb.from("catalog_modalities").select("*").order("sort_order"),
    sb.from("catalog_dependencies").select("*").order("sort_order"),
  ]);

  const links = (linksRes.data ?? []) as LinkRow[];
  const linksByRecord = new Map<string, string[]>();
  for (const link of links) {
    const list = linksByRecord.get(link.record_id) ?? [];
    list.push(link.dependency_id);
    linksByRecord.set(link.record_id, list);
  }

  const records = ((recordsRes.data ?? []) as RecordRow[]).map((row) =>
    rowToRecord(row, linksByRecord.get(row.id) ?? []),
  );

  return {
    records,
    actionTypes: actionTypesRes.data ?? [],
    modalities: modalitiesRes.data ?? [],
    dependencies: (dependenciesRes.data ?? []) as CatalogDependency[],
  };
}
