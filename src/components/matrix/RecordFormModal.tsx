"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIONS_DIMENSION_ID,
  DIMENSIONS,
  STAGES,
  STATUSES,
} from "@/constants/matrix-config";
import {
  getRecordFormSchema,
  type CatalogActionType,
  type CatalogDependency,
  type CatalogModality,
  type ActionRecordFormValues,
  type MatrixRecord,
  type RecordFormValues,
} from "@/types/matrix";
import { createRecord, updateRecord } from "@/app/actions/records";
import { Save } from "lucide-react";

type FormValues = RecordFormValues &
  Partial<
    Pick<
      ActionRecordFormValues,
      "actionName" | "actionTypeId" | "organizer" | "executor" | "modalityId"
    >
  >;

interface Props {
  open: boolean;
  onClose: () => void;
  dimensionId: number;
  stageId: number;
  record?: MatrixRecord;
  actionTypes: CatalogActionType[];
  modalities: CatalogModality[];
  dependencies: CatalogDependency[];
}

export default function RecordFormModal({
  open,
  onClose,
  dimensionId,
  stageId,
  record,
  actionTypes,
  modalities,
  dependencies,
}: Props) {
  const isAction = dimensionId === ACTIONS_DIMENSION_ID;
  const dimension = DIMENSIONS.find((d) => d.id === dimensionId);
  const schema = useMemo(() => getRecordFormSchema(dimensionId), [dimensionId]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema as never) as never,
    defaultValues: {
      dimensionId,
      primaryStageId: record?.primary_stage_id ?? stageId,
      relatedStageIds: record?.related_stage_ids ?? [],
      description: record?.description ?? "",
      status: record?.status ?? "sin_clasificar",
      dependencyIds: record?.dependency_ids ?? [],
      ...(isAction && record
        ? {
            actionName: record.action_name ?? "",
            actionTypeId: record.action_type_id ?? "",
            organizer: record.organizer ?? "",
            executor: record.executor ?? "",
            modalityId: record.modality_id ?? "",
          }
        : {}),
    } as FormValues,
  });

  const relatedStageIds = watch("relatedStageIds") ?? [];
  const dependencyIds = watch("dependencyIds") ?? [];
  const status = watch("status");

  function toggleValue(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
  }

  function toggleDependency(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
  }

  async function onSubmit(values: FormValues) {
    const res = record ? await updateRecord(record.id, values) : await createRecord(values);
    if (res.ok) {
      reset();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {record ? "Editar registro" : "Nuevo registro"}
          </DialogTitle>
          <DialogDescription>
            Dimensión: {dimension?.name ?? "—"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register("dimensionId")} />

          {isAction ? (
            <section className="space-y-4 rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Datos de la acción o recurso</h3>
              <div className="space-y-2">
                <Label htmlFor="actionName">Nombre de la acción o recurso</Label>
                <Input id="actionName" className="bg-white" {...register("actionName")} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de acción o recurso</Label>
                  <Select
                    value={watch("actionTypeId") ?? ""}
                    onValueChange={(v) => setValue("actionTypeId", v)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes
                        .filter((t) => t.is_active)
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modalidad</Label>
                  <Select
                    value={watch("modalityId") ?? ""}
                    onValueChange={(v) => setValue("modalityId", v)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecciona una modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {modalities
                        .filter((m) => m.is_active)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizer">Quién lo organiza</Label>
                  <Input id="organizer" className="bg-white" {...register("organizer")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="executor">Quién lo aplica o ejecuta</Label>
                  <Input id="executor" className="bg-white" {...register("executor")} />
                </div>
              </div>
            </section>
          ) : null}

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Descripción y clasificación</h3>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" rows={3} {...register("description")} />
              {errors.description ? (
                <p className="text-xs text-red-600">{errors.description.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Etapa principal</Label>
                <Select
                  value={String(watch("primaryStageId"))}
                  onValueChange={(v) => setValue("primaryStageId", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado del registro</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setValue("status", v as FormValues["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <Label>Etapas relacionadas</Label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setValue("relatedStageIds", toggleValue(relatedStageIds, s.id))}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    relatedStageIds.includes(s.id)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  Etapa {s.id}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <Label>Dependencias participantes</Label>
            <div className="flex flex-wrap gap-2">
              {dependencies
                .filter((d) => d.is_active)
                .map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setValue("dependencyIds", toggleDependency(dependencyIds, d.id))}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      dependencyIds.includes(d.id)
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              {dependencies.filter((d) => d.is_active).length === 0 ? (
                <p className="text-xs text-slate-400">Sin dependencias disponibles</p>
              ) : null}
            </div>
          </section>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="size-4" aria-hidden />
              {isSubmitting ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
