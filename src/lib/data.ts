import { getServerSupabase } from "@/lib/supabase/server";
import { rowToRecord, type CatalogDependency, type LinkRow, type MatrixSnapshot, type RecordRow } from "@/types/matrix";

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
