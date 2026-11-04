"use client";

import { useState } from "react";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import type { MatrixRecord } from "@/types/matrix";
import type { GraphFilters, GraphMode } from "@/lib/analysis/graph-builder";
import EcosystemNodeGraph from "./EcosystemNodeGraph";
import GraphControls from "./GraphControls";
import ChartsDashboard from "./ChartsDashboard";
import RecordDetailDrawer from "@/components/matrix/RecordDetailDrawer";
import { deleteRecord } from "@/app/actions/records";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AnalysisWorkspace() {
  const { snapshot, removeRecord } = useMatrix();
  const [mode, setMode] = useState<GraphMode>("stages");
  const [search, setSearch] = useState("");
  const [recordScope, setRecordScope] = useState<string>("normal");
  const [detailRecord, setDetailRecord] = useState<MatrixRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MatrixRecord | null>(null);

  const filters: GraphFilters = { search, recordScope };

  return (
    <main className="space-y-4 p-4">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Gráfica de nodos del ecosistema
        </h2>
        <GraphControls
          mode={mode}
          onModeChange={setMode}
          search={search}
          onSearchChange={setSearch}
          recordScope={recordScope}
          onRecordScopeChange={(v: unknown) => setRecordScope(String(v))}
          scope={recordScope}
          onScopeChange={(v: unknown) => setRecordScope(String(v))}
        />
        <EcosystemNodeGraph
          records={snapshot.records}
          dependencies={snapshot.dependencies}
          mode={mode}
          filters={filters}
          onSelectRecord={setDetailRecord}
        />
        <p className="text-xs text-slate-500">
          Haz clic en un nodo de registro para abrir su ficha. Los nodos se conectan
          automáticamente según etapas y dependencias compartidas.
        </p>
      </div>

      <ChartsDashboard snapshot={snapshot} />

      {detailRecord ? (
        <RecordDetailDrawer
          record={snapshot.records.find((r) => r.id === detailRecord.id) ?? detailRecord}
          typeName={snapshot.actionTypes.find((t) => t.id === detailRecord.action_type_id)?.name}
          modalityName={snapshot.modalities.find((m) => m.id === detailRecord.modality_id)?.name}
          dependencyNames={snapshot.dependencies
            .filter((d) => detailRecord.dependency_ids.includes(d.id))
            .map((d) => d.name)}
          onClose={() => setDetailRecord(null)}
          onDelete={() => {
            setPendingDelete(detailRecord);
            setDetailRecord(null);
          }}
        />
      ) : null}

      <Dialog open={!!pendingDelete} onOpenChange={(o) => (!o ? setPendingDelete(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este registro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El registro se eliminará permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  void deleteRecord(pendingDelete.id);
                  removeRecord?.(pendingDelete.id);
                }
                setPendingDelete(null);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
