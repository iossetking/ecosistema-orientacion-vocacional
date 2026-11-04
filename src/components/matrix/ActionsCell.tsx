import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { CatalogActionType, MatrixRecord } from "@/types/matrix";
import RecordCard from "./RecordCard";

export default function ActionsCell({
  stageId,
  records,
  actionTypes,
  onOpen,
  onAdd,
}: {
  stageId: number;
  records: MatrixRecord[];
  actionTypes: CatalogActionType[];
  onOpen: (record: MatrixRecord) => void;
  onAdd: (dimensionId: number, stageId: number) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = new Map<string, MatrixRecord[]>();
  for (const record of records) {
    const key = record.action_type_id ?? "sin_tipo";
    const list = groups.get(key) ?? [];
    list.push(record);
    groups.set(key, list);
  }

  return (
    <div className="flex min-h-24 flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-2">
      {groups.size === 0 ? (
        <p className="py-2 text-center text-xs text-slate-400">Sin registros</p>
      ) : null}
      {[...groups.entries()].map(([typeId, items]) => {
        const type = actionTypes.find((t) => t.id === typeId);
        const groupName = type?.name ?? "Sin tipo";
        const isCollapsed = collapsed[typeId] ?? false;
        return (
          <div key={typeId} className="rounded-md border border-slate-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center gap-1 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600"
              onClick={() => setCollapsed((c) => ({ ...c, [typeId]: !isCollapsed }))}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight className="size-3.5" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden />
              )}
              <span className="flex-1">{groupName}</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {items.length}
              </span>
            </button>
            {!isCollapsed ? (
              <div className="flex flex-col gap-1 px-2 pb-2">
                {items.map((record) => (
                  <RecordCard key={record.id} record={record} onOpen={onOpen} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onAdd(3, stageId)}
        className="mt-auto flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-500 hover:bg-white hover:text-slate-700"
      >
        <Plus className="size-3.5" aria-hidden />
        Agregar registro
      </button>
    </div>
  );
}
