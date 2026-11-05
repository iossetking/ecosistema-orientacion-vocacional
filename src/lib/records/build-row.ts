import { ACTIONS_DIMENSION_ID } from "@/constants/matrix-config";
import type {
  ActionRecordFormValues,
  RecordFormValues,
  RecordStatus,
  SessionUser,
} from "@/types/matrix";

export type AnyRecordFormValues = RecordFormValues | ActionRecordFormValues;

export interface RecordInsertRow {
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
}

export type RecordUpdateRow = Omit<RecordInsertRow, "created_by_name" | "created_by_dependency">;

function commonFields(input: AnyRecordFormValues) {
  const isAction = input.dimensionId === ACTIONS_DIMENSION_ID;
  const action = isAction ? (input as ActionRecordFormValues) : null;
  return {
    dimension_id: input.dimensionId,
    primary_stage_id: input.primaryStageId,
    related_stage_ids: input.relatedStageIds,
    description: input.description,
    status: isAction ? ((input as ActionRecordFormValues).status ?? null) : null,
    action_name: action?.actionName ?? null,
    action_type_id: action?.actionTypeId ?? null,
    organizer: action?.organizer ?? null,
    executor: action?.executor ?? null,
    modality_id: action?.modalityId ?? null,
  };
}

export function buildCreateRow(input: AnyRecordFormValues, user: SessionUser): RecordInsertRow {
  return {
    ...commonFields(input),
    created_by_name: user.name,
    created_by_dependency: user.dependency,
    updated_by_name: user.name,
    updated_by_dependency: user.dependency,
  };
}

export function buildUpdateRow(input: AnyRecordFormValues, user: SessionUser): RecordUpdateRow {
  return {
    ...commonFields(input),
    updated_by_name: user.name,
    updated_by_dependency: user.dependency,
  };
}
