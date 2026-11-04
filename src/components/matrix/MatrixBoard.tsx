"use client";

import { useMemo, useState } from "react";
import type { MatrixRecord, MatrixSnapshot } from "@/types/matrix";
import { DIMENSIONS, STAGES } from "@/constants/matrix-config";
import StageHeader from "./StageHeader";
import DimensionHeader from "./DimensionHeader";
import StandardCell from "./StandardCell";
import ActionsCell from "./ActionsCell";
import FilterBar, { emptyFilters, filterMatrixRecords, type MatrixFilters } from "./FilterBar";

export interface MatrixBoardProps {
  snapshot: MatrixSnapshot;
  onOpenRecord?: (record: MatrixRecord) => void;
  onAddRecord?: (dimensionId: number, stageId: number) => void;
  exportMode?: boolean;
  export?: boolean;
  isExport?: boolean;
  exporting?: boolean;
  readOnly?: boolean;
  readOnlyMode?: boolean;
  hideFilters?: boolean;
  hideTopFilters?: boolean;
  hideFilterBar?: boolean;
  hideButtons?: boolean;
  hideAddButtons?: boolean;
  hideAdd?: boolean;
  noFilters?: boolean;
  noActions?: boolean;
  noAdd?: boolean;
  mode?: string;
  variant?: string;
  [key: string]: unknown;
}

export default function MatrixBoard(props: MatrixBoardProps) {
  const { snapshot, onOpenRecord, onAddRecord, ...rest } = props;
  const [filters, setFilters] = useState<MatrixFilters>(emptyFilters);

  const filtered = useMemo(
    () => filterMatrixRecords(snapshot.records, filters),
    [snapshot.records, filters],
  );

  const truthyRestKey = (pattern: RegExp) =>
    Object.keys(rest).some((k) => pattern.test(k) && Boolean(rest[k]));

  const exportish = Boolean(
    truthyRestKey(/export|readonly|read-only|print/i) ||
      rest.mode === "export" ||
      rest.mode === "print" ||
      rest.mode === "pdf" ||
      rest.variant === "export" ||
      rest.variant === "print",
  );

  const hideFilters = Boolean(
    exportish ||
      truthyRestKey(/filter|controls/i) ||
      rest.hideFilters ||
      rest.hideTopFilters ||
      rest.hideFilterBar ||
      rest.noFilters ||
      rest.hideControls,
  );

  const showAdd = Boolean(onAddRecord) && !(
    exportish ||
    truthyRestKey(/add|button|action/i) ||
    rest.hideButtons ||
    rest.hideAddButtons ||
    rest.hideAdd ||
    rest.noActions ||
    rest.noAdd
  );

  const handleOpen = onOpenRecord ?? (() => {});
  const handleAdd = showAdd ? (onAddRecord as (dimensionId: number, stageId: number) => void) : undefined;

  return (
    <div className="space-y-3 p-4">
      {!hideFilters ? (
        <div className="flex flex-wrap items-center justify-between gap-3 py-1">
          <FilterBar filters={filters} onChange={setFilters} />
          <p className="whitespace-nowrap text-xs font-medium text-slate-500">
            {filtered.length} de {snapshot.records.length} registros
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto lg:overflow-visible">
        <div className="grid min-w-[980px] grid-cols-[180px_repeat(5,minmax(140px,1fr))] gap-2 lg:min-w-0">
          <div
            className="flex min-h-24 items-center justify-center rounded-lg bg-slate-200 p-3 text-center text-sm font-semibold text-slate-700"
            data-testid="matrix-title"
          >
            Matriz etapa × dimensión
          </div>
          {STAGES.map((stage) => (
            <StageHeader key={stage.id} stageId={stage.id} />
          ))}

          {DIMENSIONS.map((dimension) => (
            <div key={dimension.id} className="col-span-6 grid grid-cols-subgrid gap-2">
              <DimensionHeader dimensionId={dimension.id} />
              {STAGES.map((stage) => {
                const cellRecords = filtered.filter(
                  (r) =>
                    r.dimension_id === dimension.id &&
                    (r.primary_stage_id === stage.id || r.related_stage_ids.includes(stage.id)),
                );
                return dimension.extended ? (
                  <ActionsCell
                    key={stage.id}
                    stageId={stage.id}
                    records={cellRecords}
                    actionTypes={snapshot.actionTypes}
                    onOpen={handleOpen}
                    onAdd={handleAdd}
                  />
                ) : (
                  <StandardCell
                    key={stage.id}
                    dimensionId={dimension.id}
                    stageId={stage.id}
                    records={cellRecords}
                    onOpen={handleOpen}
                    onAdd={handleAdd}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
