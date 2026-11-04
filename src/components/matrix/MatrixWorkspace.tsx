"use client";

import { useState } from "react";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import type { MatrixRecord } from "@/types/matrix";
import MatrixBoard from "./MatrixBoard";
import RecordFormModal from "./RecordFormModal";
import RecordDetailDrawer from "./RecordDetailDrawer";
import { deleteRecord } from "@/app/actions/records";

type ModalState =
  | { mode: "closed" }
  | { mode: "create"; dimensionId: number; stageId: number }
  | { mode: "edit"; record: MatrixRecord };

export default function MatrixWorkspace() {
  const { snapshot } = useMatrix();
  const [modalState, setModalState] = useState<ModalState>({ mode: "closed" });
  const [detailRecord, setDetailRecord] = useState<MatrixRecord | null>(null);

  return (
    <main>
      <MatrixBoard
        snapshot={snapshot}
        onOpenRecord={setDetailRecord}
        onAddRecord={(dimensionId, stageId) =>
          setModalState({ mode: "create", dimensionId, stageId })
        }
      />

      {modalState.mode === "create" ? (
        <RecordFormModal
          open
          onClose={() => setModalState({ mode: "closed" })}
          dimensionId={modalState.dimensionId}
          stageId={modalState.stageId}
          actionTypes={snapshot.actionTypes}
          modalities={snapshot.modalities}
          dependencies={snapshot.dependencies}
        />
      ) : null}

      {modalState.mode === "edit" ? (
        <RecordFormModal
          open
          onClose={() => setModalState({ mode: "closed" })}
          dimensionId={modalState.record.dimension_id}
          stageId={modalState.record.primary_stage_id}
          record={modalState.record}
          actionTypes={snapshot.actionTypes}
          modalities={snapshot.modalities}
          dependencies={snapshot.dependencies}
        />
      ) : null}

      {detailRecord ? (
        <RecordDetailDrawer
          record={snapshot.records.find((r) => r.id === detailRecord.id) ?? detailRecord}
          typeName={snapshot.actionTypes.find((t) => t.id === detailRecord.action_type_id)?.name}
          modalityName={snapshot.modalities.find((m) => m.id === detailRecord.modality_id)?.name}
          dependencyNames={snapshot.dependencies
            .filter((d) => detailRecord.dependency_ids.includes(d.id))
            .map((d) => d.name)}
          onClose={() => setDetailRecord(null)}
          onEdit={() => {
            setModalState({ mode: "edit", record: detailRecord });
            setDetailRecord(null);
          }}
          onDelete={() => {
            if (window.confirm("¿Eliminar este registro?")) {
              void deleteRecord(detailRecord.id);
              setDetailRecord(null);
            }
          }}
        />
      ) : null}
    </main>
  );
}
