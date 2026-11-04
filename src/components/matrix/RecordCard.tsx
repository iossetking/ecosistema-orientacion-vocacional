import { getStatus } from "@/constants/matrix-config";
import type { MatrixRecord } from "@/types/matrix";

export default function RecordCard({
  record,
  onOpen,
}: {
  record: MatrixRecord;
  onOpen: (record: MatrixRecord) => void;
}) {
  const status = getStatus(record.status);
  const label = record.action_name ?? record.description;
  return (
    <button
      type="button"
      onClick={() => onOpen(record)}
      className="w-full min-h-[2.5rem] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300"
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: status?.color ?? "#9ca3af" }}
          aria-label={status?.label}
          title={status?.label}
        />
        <p className="line-clamp-3 text-xs leading-snug text-slate-700">{label}</p>
      </div>
    </button>
  );
}
