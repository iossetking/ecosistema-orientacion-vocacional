import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GraphControls from "@/components/analysis/GraphControls";
import AnalysisWorkspace from "@/components/analysis/AnalysisWorkspace";
import { MatrixProvider } from "@/hooks/useRealtimeMatrix";
import type { MatrixSnapshot } from "@/types/matrix";

const snapshot: MatrixSnapshot = {
  records: [
    {
      id: "r1",
      dimension_id: 1,
      primary_stage_id: 1,
      related_stage_ids: [2],
      description: "Necesidad de orientación",
      status: "sin_clasificar",
      action_name: null,
      action_type_id: null,
      organizer: null,
      executor: null,
      modality_id: null,
      created_by_name: "Ana",
      created_by_dependency: "CGAI",
      updated_by_name: "Ana",
      updated_by_dependency: "CGAI",
      created_at: "2026-11-03T10:00:00Z",
      updated_at: "2026-11-03T10:00:00Z",
      dependency_ids: [],
    },
  ],
  actionTypes: [],
  modalities: [],
  dependencies: [],
};

describe("GraphControls", () => {
  it("muestra los tres modos de conexión", () => {
    render(
      <GraphControls
        mode="stages"
        onModeChange={() => {}}
        search=""
        onSearchChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /por etapas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /por dependencias/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ecosistema completo/i })).toBeInTheDocument();
  });
});

describe("AnalysisWorkspace", () => {
  it("renderiza grafo y dashboard sin crashear", () => {
    render(
      <MatrixProvider initial={snapshot}>
        <AnalysisWorkspace />
      </MatrixProvider>,
    );
    expect(screen.getByText(/Gráfica de nodos del ecosistema/i)).toBeInTheDocument();
    expect(screen.getByText(/Distribución por estado/i)).toBeInTheDocument();
  });
});
