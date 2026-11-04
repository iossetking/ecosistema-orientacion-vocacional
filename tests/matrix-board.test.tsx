import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActionsCell from "@/components/matrix/ActionsCell";
import MatrixBoard from "@/components/matrix/MatrixBoard";
import Navbar from "@/components/layout/Navbar";
import type { MatrixRecord, MatrixSnapshot } from "@/types/matrix";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const actionRecord = (id: string, typeId: string, name: string): MatrixRecord => ({
  id,
  dimension_id: 3,
  primary_stage_id: 1,
  related_stage_ids: [],
  description: "Descripción de la acción",
  status: "existe_y_funciona",
  action_name: name,
  action_type_id: typeId,
  organizer: "SEMS",
  executor: "Preparatorias",
  modality_id: "m1",
  created_by_name: "Ana",
  created_by_dependency: "CGAI",
  updated_by_name: "Ana",
  updated_by_dependency: "CGAI",
  created_at: "2026-11-03T10:00:00Z",
  updated_at: "2026-11-03T10:00:00Z",
  dependency_ids: [],
});

const snapshot: MatrixSnapshot = {
  records: [
    actionRecord("r1", "t1", "Test vocacional A"),
    actionRecord("r2", "t1", "Test vocacional B"),
    actionRecord("r3", "t2", "Asesoría individual"),
  ],
  actionTypes: [
    { id: "t1", name: "Test vocacionales", sort_order: 1, is_active: true },
    { id: "t2", name: "Asesorías personalizadas", sort_order: 2, is_active: true },
  ],
  modalities: [{ id: "m1", name: "Presencial", sort_order: 1, is_active: true }],
  dependencies: [],
};

describe("ActionsCell", () => {
  it("agrupa acciones por tipo con contador", () => {
    const onOpen = vi.fn();
    const onAdd = vi.fn();
    render(
      <ActionsCell
        stageId={1}
        records={snapshot.records}
        actionTypes={snapshot.actionTypes}
        onOpen={onOpen}
        onAdd={onAdd}
      />,
    );
    expect(screen.getByText(/TEST VOCACIONALES/i)).toBeInTheDocument();
    expect(screen.getByText(/ASESORÍAS PERSONALIZADAS/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("MatrixBoard", () => {
  it("renderiza la cuadrícula 5 etapas × 7 dimensiones y contador", () => {
    render(<MatrixBoard snapshot={snapshot} />);
    for (let stage = 1; stage <= 5; stage++) {
      expect(screen.getByTestId(`stage-header-${stage}`)).toBeInTheDocument();
    }
    for (let dim = 1; dim <= 7; dim++) {
      expect(screen.getByTestId(`dimension-header-${dim}`)).toBeInTheDocument();
    }
    expect(screen.getByText(/3 de 3 registros/i)).toBeInTheDocument();
  });

  it("filtra por búsqueda de texto", async () => {
    render(<MatrixBoard snapshot={snapshot} />);
    await userEvent.type(screen.getByPlaceholderText(/buscar/i), "Asesoría");
    expect(screen.getByText(/1 de 3 registros/i)).toBeInTheDocument();
  });
});

describe("Navbar", () => {
  it("muestra tabs, usuario y badge de sincronización", () => {
    render(<Navbar user={{ name: "Ana", dependency: "CGAI" }} connection="live" />);
    expect(screen.getByRole("link", { name: "Matriz" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Análisis" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catálogos" })).toBeInTheDocument();
    expect(screen.getByText(/Sincronización en vivo/i)).toBeInTheDocument();
    expect(screen.getByText(/Ana · CGAI/i)).toBeInTheDocument();
  });
});
