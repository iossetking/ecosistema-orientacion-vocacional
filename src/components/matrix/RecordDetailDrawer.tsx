"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getStatus, getDimension, getStage } from "@/constants/matrix-config";
import type { MatrixRecord } from "@/types/matrix";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function RecordDetailDrawer({
  record,
  typeName,
  modalityName,
  dependencyNames,
  onClose,
  onEdit,
  onDelete,
}: {
  record: MatrixRecord;
  typeName?: string;
  modalityName?: string;
  dependencyNames: string[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const status = getStatus(record.status);
  const dimension = getDimension(record.dimension_id);
  const stage = getStage(record.primary_stage_id);

  return (
    <Sheet open onOpenChange={(o) => (!o ? onClose() : null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pr-10">
          <SheetTitle className="text-left">
            {record.action_name ?? dimension?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 p-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: status?.color }} />
            <span className="font-medium">{status?.label}</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">Dimensión</p>
            <p>{dimension?.name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">Etapa principal</p>
            <p>{stage?.name}</p>
            {record.related_stage_ids.length > 0 ? (
              <p className="text-xs text-slate-500">
                Etapas relacionadas:{" "}
                {record.related_stage_ids
                  .map((id) => getStage(id)?.name ?? `Etapa ${id}`)
                  .join(", ")}
              </p>
            ) : null}
          </div>

          {record.dimension_id === 3 ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Tipo</p>
                <p>{typeName ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Modalidad</p>
                <p>{modalityName ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Organiza</p>
                <p>{record.organizer ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Ejecuta</p>
                <p>{record.executor ?? "—"}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">Descripción</p>
            <p className="text-slate-700">{record.description}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Dependencias participantes
            </p>
            {dependencyNames.length > 0 ? (
              <p>{dependencyNames.join(", ")}</p>
            ) : (
              <p className="text-slate-400">Sin dependencias</p>
            )}
          </div>

          <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p>
              Creado por: {record.created_by_name} ({record.created_by_dependency}) el{" "}
              {formatDate(record.created_at)}
            </p>
            <p>
              Última edición: {record.updated_by_name} ({record.updated_by_dependency}) el{" "}
              {formatDate(record.updated_at)}
            </p>
          </div>

          {onEdit || onDelete ? (
            <div className="flex gap-2">
              {onEdit ? (
                <Button className="flex-1" onClick={onEdit}>
                  Editar
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("¿Eliminar este registro?")) onDelete();
                  }}
                >
                  Eliminar
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
