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
}

export default function MatrixBoard({ snapshot, onOpenRecord, onAddRecord }: MatrixBoardProps) {
  const [filters, setFilters] = useState<MatrixFilters>(emptyFilters);

  const filtered = useMemo(
    () => filterMatrixRecords(snapshot.records, filters),
    [snapshot.records, filters],
  );

  const handleOpen = onOpenRecord ?? (() => {});
  const handleAdd = onAddRecord ?? (() => {});

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 py-1">
        <FilterBar filters={filters} onChange={setFilters} />
        <p className="whitespace-nowrap text-xs font-medium text-slate-500">
          {filtered.length} de {snapshot.records.length} registros
        </p>
      </div>

      <div className="overflow-x-auto lg:overflow-visible">
        <div className="grid min-w-[980px] grid-cols-[180px_repeat(5,minmax(140px,1fr))] gap-2 lg:min-w-0">
          <div />
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
