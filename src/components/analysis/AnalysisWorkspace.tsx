"use client";

import { useState } from "react";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import type { MatrixRecord } from "@/types/matrix";
import type { GraphFilters, GraphMode } from "@/lib/analysis/graph-builder";
import EcosystemNodeGraph from "./EcosystemNodeGraph";
import GraphControls from "./GraphControls";
import ChartsDashboard from "./ChartsDashboard";
import RecordDetailDrawer from "@/components/matrix/RecordDetailDrawer";

export default function AnalysisWorkspace() {
  const { snapshot } = useMatrix();
  const [mode, setMode] = useState<GraphMode>("stages");
  const [search, setSearch] = useState("");
  const [detailRecord, setDetailRecord] = useState<MatrixRecord | null>(null);

  const filters: GraphFilters = { search };

  return (
    <main className="space-y-4 p-4">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Gráfica de nodos del ecosistema
        </h2>
        <GraphControls mode={mode} onModeChange={setMode} search={search} onSearchChange={setSearch} />
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
          record={detailRecord}
          typeName={snapshot.actionTypes.find((t) => t.id === detailRecord.action_type_id)?.name}
          modalityName={snapshot.modalities.find((m) => m.id === detailRecord.modality_id)?.name}
          dependencyNames={snapshot.dependencies
            .filter((d) => detailRecord.dependency_ids.includes(d.id))
            .map((d) => d.name)}
          onClose={() => setDetailRecord(null)}
        />
      ) : null}
    </main>
  );
}
