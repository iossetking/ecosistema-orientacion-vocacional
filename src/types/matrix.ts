import { z } from "zod";

export type RecordStatus =
  | "no_existe"
  | "no_funciona"
  | "posible_duplicado"
  | "existe_y_funciona"
  | "requiere_fortalecimiento"
  | "sin_clasificar";

export interface CatalogActionType {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CatalogModality {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CatalogDependency {
  id: string;
  name: string;
  code: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SessionUser {
  name: string;
  dependency: string;
}

export interface MatrixRecord {
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
  dependency_ids: string[];
}

export type CatalogKind = "action_types" | "modalities" | "dependencies";

export interface MatrixSnapshot {
  records: MatrixRecord[];
  actionTypes: CatalogActionType[];
  modalities: CatalogModality[];
  dependencies: CatalogDependency[];
}

export const recordStatusSchema = z.enum([
  "no_existe",
  "no_funciona",
  "posible_duplicado",
  "existe_y_funciona",
  "requiere_fortalecimiento",
  "sin_clasificar",
]);

export const baseRecordFormSchema = z.object({
  dimensionId: z.number().int().min(1).max(7),
  primaryStageId: z.number().int().min(1).max(5),
  relatedStageIds: z.array(z.number().int().min(1).max(5)).max(5).default([]),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(2000),
  dependencyIds: z.array(z.string().uuid()).default([]),
});

export const actionRecordFormSchema = baseRecordFormSchema.extend({
  status: recordStatusSchema,
  actionName: z.string().trim().min(1, "El nombre de la acción es obligatorio").max(200),
  actionTypeId: z.string().uuid("Selecciona un tipo de acción o recurso"),
  organizer: z.string().trim().min(1, "Indica quién lo organiza").max(200),
  executor: z.string().trim().min(1, "Indica quién lo aplica o ejecuta").max(200),
  modalityId: z.string().uuid("Selecciona una modalidad"),
});

export function getRecordFormSchema(dimensionId: number) {
  return dimensionId === 3 ? actionRecordFormSchema : baseRecordFormSchema;
}

export type RecordFormValues = z.infer<typeof baseRecordFormSchema>;
export type ActionRecordFormValues = z.infer<typeof actionRecordFormSchema>;

export const pinLoginSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(100),
  dependency: z.string().trim().min(1, "Indica tu dependencia").max(120),
  pin: z.string().trim().min(4, "El PIN debe tener al menos 4 caracteres").max(12),
});

export type PinLoginValues = z.infer<typeof pinLoginSchema>;

export const catalogCreateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
});

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
