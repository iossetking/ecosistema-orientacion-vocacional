import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StageHeader from "@/components/matrix/StageHeader";
import DimensionHeader from "@/components/matrix/DimensionHeader";
import RecordCard from "@/components/matrix/RecordCard";
import StandardCell from "@/components/matrix/StandardCell";
import TrajectoryFooter from "@/components/layout/TrajectoryFooter";
import type { MatrixRecord } from "@/types/matrix";

const record: MatrixRecord = {
  id: "r1",
  dimension_id: 1,
  primary_stage_id: 1,
  related_stage_ids: [],
  description: "Orientación individual temprana",
  status: "existe_y_funciona",
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
};

describe("StageHeader", () => {
  it("muestra nombre de la etapa", () => {
    render(<StageHeader stageId={1} />);
    expect(screen.getByText(/Autoconocimiento/i)).toBeInTheDocument();
  });
});

describe("DimensionHeader", () => {
  it("muestra nombre y pregunta guía", () => {
    render(<DimensionHeader dimensionId={1} />);
    expect(screen.getByText(/Necesidades del estudiante/i)).toBeInTheDocument();
    expect(screen.getByText(/¿Qué requiere el estudiantado/i)).toBeInTheDocument();
  });
});

describe("RecordCard", () => {
  it("muestra la descripción y dispara onOpen", async () => {
    const onOpen = vi.fn();
    render(<RecordCard record={record} onOpen={onOpen} />);
    await userEvent.click(screen.getByText(/Orientación individual/i));
    expect(onOpen).toHaveBeenCalledWith(record);
  });
});

describe("StandardCell", () => {
  it("lista registros y muestra botón agregar", async () => {
    const onOpen = vi.fn();
    const onAdd = vi.fn();
    render(
      <StandardCell
        dimensionId={1}
        stageId={1}
        records={[record]}
        onOpen={onOpen}
        onAdd={onAdd}
      />,
    );
    expect(screen.getByText(/Orientación individual/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /agregar registro/i }));
    expect(onAdd).toHaveBeenCalledWith(1, 1);
  });
});

describe("TrajectoryFooter", () => {
  it("muestra los tres niveles de la trayectoria", () => {
    render(<TrajectoryFooter />);
    expect(screen.getByText(/Media Superior/i)).toBeInTheDocument();
    expect(screen.getByText(/Transición/i)).toBeInTheDocument();
    expect(screen.getByText(/^Superior/i)).toBeInTheDocument();
  });
});
