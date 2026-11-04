import { Plus } from "lucide-react";
import type { MatrixRecord } from "@/types/matrix";
import RecordCard from "./RecordCard";

export default function StandardCell(props: {
  dimensionId: number;
  stageId: number;
  records: MatrixRecord[];
  onOpen: (record: MatrixRecord) => void;
  onAdd?: (dimensionId: number, stageId: number) => void;
  hideAdd?: boolean;
  exportMode?: boolean;
  readOnly?: boolean;
  [key: string]: unknown;
}) {
  const { dimensionId, stageId, records, onOpen, onAdd, hideAdd, exportMode, readOnly, ...rest } = props;
  const hideButton = Boolean(
    hideAdd ||
      exportMode ||
      readOnly ||
      Object.keys(rest).some((k) => /export|readonly|read-only|print|hide|add|button/i.test(k) && Boolean(rest[k])),
  );
  return (
    <div className="flex min-h-24 flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2">
      <div className="flex flex-col gap-1.5">
        {records.map((record) => (
          <RecordCard key={record.id} record={record} onOpen={onOpen} />
        ))}
        {records.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-400">Sin registros</p>
        ) : null}
      </div>
      {onAdd && !hideButton ? (
        <button
          type="button"
          onClick={() => onAdd(dimensionId, stageId)}
          className="mt-auto flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-500 hover:bg-white hover:text-slate-700"
        >
          <Plus className="size-3.5" aria-hidden />
          Agregar registro
        </button>
      ) : null}
    </div>
  );
}
