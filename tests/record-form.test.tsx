import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecordFormModal from "@/components/matrix/RecordFormModal";
import RecordDetailDrawer from "@/components/matrix/RecordDetailDrawer";
import type { MatrixRecord } from "@/types/matrix";

vi.mock("@/app/actions/records", () => ({
  createRecord: vi.fn().mockResolvedValue({ ok: true }),
  updateRecord: vi.fn().mockResolvedValue({ ok: true }),
  deleteRecord: vi.fn().mockResolvedValue({ ok: true }),
}));

const baseRecord: MatrixRecord = {
  id: "r1",
  dimension_id: 3,
  primary_stage_id: 2,
  related_stage_ids: [3],
  description: "Taller de planeación de carrera",
  status: "requiere_fortalecimiento",
  datos: null,
  action_name: "Taller de decisiones",
  action_type_id: "t1",
  organizer: "CGAI",
  executor: "Preparatorias",
  modality_id: "m1",
  created_by_name: "Ana",
  created_by_dependency: "CGAI",
  updated_by_name: "Carlos",
  updated_by_dependency: "SEMS",
  created_at: "2026-11-03T10:15:00Z",
  updated_at: "2026-11-03T11:40:00Z",
  dependency_ids: ["d1"],
};

describe("RecordFormModal", () => {
  it("muestra campos extendidos cuando la dimensión es 3", () => {
    render(
      <RecordFormModal
        open
        onClose={() => {}}
        dimensionId={3}
        stageId={2}
        actionTypes={[{ id: "t1", name: "Talleres o charlas", sort_order: 1, is_active: true }]}
        modalities={[{ id: "m1", name: "Presencial", sort_order: 1, is_active: true }]}
        dependencies={[{ id: "d1", name: "SEMS", code: "SEMS", sort_order: 1, is_active: true }]}
      />,
    );
    expect(screen.getByLabelText(/nombre de la acción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quién lo organiza/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quién lo aplica/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
  });

  it("oculta campos extendidos en dimensiones estándar", () => {
    render(
      <RecordFormModal
        open
        onClose={() => {}}
        dimensionId={1}
        stageId={1}
        actionTypes={[]}
        modalities={[]}
        dependencies={[]}
      />,
    );
    expect(screen.queryByLabelText(/nombre de la acción/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
  });
});

describe("RecordDetailDrawer", () => {
  it("muestra ficha completa y autoría", () => {
    render(
      <RecordDetailDrawer
        record={baseRecord}
        typeName="Talleres o charlas"
        modalityName="Presencial"
        dependencyNames={["SEMS"]}
        onClose={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText(/Taller de decisiones/i)).toBeInTheDocument();
    expect(screen.getByText(/Creado por:/i)).toBeInTheDocument();
    expect(screen.getByText(/Última edición:/i)).toBeInTheDocument();
    expect(screen.getByText(/Ana \(CGAI\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Carlos \(SEMS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/^SEMS$/)).toBeInTheDocument();
  });
});
