import { Plus } from "lucide-react";
import type { MatrixRecord } from "@/types/matrix";
import RecordCard from "./RecordCard";

export default function StandardCell({
  dimensionId,
  stageId,
  records,
  onOpen,
  onAdd,
}: {
  dimensionId: number;
  stageId: number;
  records: MatrixRecord[];
  onOpen: (record: MatrixRecord) => void;
  onAdd: (dimensionId: number, stageId: number) => void;
}) {
  return (
    <div className="flex min-h-24 flex-col gap-2 rounded-lg border border-slate-200 bg-white/60 p-2">
      <div className="flex flex-col gap-1.5">
        {records.map((record) => (
          <RecordCard key={record.id} record={record} onOpen={onOpen} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onAdd(dimensionId, stageId)}
        className="mt-auto flex items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-xs text-slate-500 transition hover:border-slate-500 hover:text-slate-700"
      >
        <Plus className="size-3.5" aria-hidden />
        Agregar registro
      </button>
    </div>
  );
}
