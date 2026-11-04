"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
          <DialogTitle>
            {record ? "Editar registro" : "Nuevo registro"} —{" "}
            {DIMENSIONS.find((d) => d.id === dimensionId)?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("dimensionId")} />

          {isAction ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="actionName">Nombre de la acción o recurso</Label>
                <Input id="actionName" {...register("actionName")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo de acción o recurso</Label>
                  <Select
                    value={watch("actionTypeId") ?? ""}
                    onValueChange={(v) => setValue("actionTypeId", v)}
                  >
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                  <Input id="organizer" {...register("organizer")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="executor">Quién lo aplica o ejecuta</Label>
                  <Input id="executor" {...register("executor")} />
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={3} {...register("description")} />
            {errors.description ? (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            ) : null}
          </div>

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
            <Label>Etapas relacionadas</Label>
            <div className="flex flex-wrap gap-3">
              {STAGES.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Checkbox
                    checked={relatedStageIds.includes(s.id)}
                    onCheckedChange={() =>
                      setValue("relatedStageIds", toggleValue(relatedStageIds, s.id))
                    }
                  />
                  Etapa {s.id}
                </label>
              ))}
            </div>
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

          <div className="space-y-2">
            <Label>Dependencias participantes</Label>
            <div className="flex flex-wrap gap-3">
              {dependencies
                .filter((d) => d.is_active)
                .map((d) => (
                  <label key={d.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Checkbox
                      checked={dependencyIds.includes(d.id)}
                      onCheckedChange={() =>
                        setValue("dependencyIds", toggleDependency(dependencyIds, d.id))
                      }
                    />
                    {d.name}
                  </label>
                ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
