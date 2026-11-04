"use client";

import { useRef, useState } from "react";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import MatrixBoard from "@/components/matrix/MatrixBoard";
import ChartsDashboard from "@/components/analysis/ChartsDashboard";
import EcosystemNodeGraph from "@/components/analysis/EcosystemNodeGraph";
import { Button } from "@/components/ui/button";
import { exportElementToPdf } from "@/lib/export/pdf";

export default function ExportWorkspace() {
  const { snapshot } = useMatrix();
  const matrixRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const allRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, ref: React.RefObject<HTMLDivElement | null>, file: string) {
    if (!ref.current) return;
    setBusy(key);
    try {
      await exportElementToPdf(ref.current, file);
    } catch (e) {
      console.error("EXPORT_FAIL", file, e);
      throw e;
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Exportación a PDF</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => run("matrix", matrixRef, "matriz.pdf")}
            disabled={busy !== null}
          >
            {busy === "matrix" ? "Exportando…" : "Exportar Matriz"}
          </Button>
          <Button
            onClick={() => run("analysis", analysisRef, "analisis.pdf")}
            disabled={busy !== null}
          >
            {busy === "analysis" ? "Exportando…" : "Exportar Análisis"}
          </Button>
          <Button
            variant="outline"
            onClick={() => run("all", allRef, "reporte-completo.pdf")}
            disabled={busy !== null}
          >
            {busy === "all" ? "Exportando…" : "Exportar Todo"}
          </Button>
        </div>
      </div>

      <div ref={allRef} className="space-y-6">
        <section ref={matrixRef} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Vista matriz</h3>
          <MatrixBoard
            snapshot={snapshot}
            readOnly
            exportMode
            mode="export"
            hideFilters
            hideTopFilters
            hideFilterBar
            hideButtons
            hideAddButtons
            hideAdd
            noFilters
            noActions
            noAdd
          />
        </section>

        <section ref={analysisRef} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Gráficas de análisis</h3>
          <ChartsDashboard snapshot={snapshot} />
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">
                Gráfica de nodos del ecosistema — Ecosistema completo — Registros normales
              </h4>
              <EcosystemNodeGraph
                records={snapshot.records}
                dependencies={snapshot.dependencies}
                actionTypes={snapshot.actionTypes}
                mode="full"
                filters={{ recordScope: "normal" }}
                onSelectRecord={() => {}}
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">
                Gráfica de nodos del ecosistema — Ecosistema completo — Acciones y recursos
              </h4>
              <EcosystemNodeGraph
                records={snapshot.records}
                dependencies={snapshot.dependencies}
                actionTypes={snapshot.actionTypes}
                mode="full"
                filters={{ recordScope: "actions" }}
                onSelectRecord={() => {}}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}