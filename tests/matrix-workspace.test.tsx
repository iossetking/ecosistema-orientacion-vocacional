import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MatrixProvider } from "@/hooks/useRealtimeMatrix";
import MatrixWorkspace from "@/components/matrix/MatrixWorkspace";
import type { MatrixSnapshot } from "@/types/matrix";

vi.mock("@/app/actions/records", () => ({
  createRecord: vi.fn().mockResolvedValue({ ok: true }),
  updateRecord: vi.fn().mockResolvedValue({ ok: true }),
  deleteRecord: vi.fn().mockResolvedValue({ ok: true }),
}));

const snapshot: MatrixSnapshot = {
  records: [
    {
      id: "r1",
      dimension_id: 1,
      primary_stage_id: 1,
      related_stage_ids: [],
      description: "Necesidad de tutorías",
      status: "sin_clasificar",
      datos: null,
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

describe("MatrixWorkspace", () => {
  it("abre el modal al pulsar Agregar registro", async () => {
    render(
      <MatrixProvider initial={snapshot}>
        <MatrixWorkspace />
      </MatrixProvider>,
    );
    const addButtons = screen.getAllByRole("button", { name: /agregar registro/i });
    await userEvent.click(addButtons[0]);
    expect(await screen.findByText(/Nuevo registro/i)).toBeInTheDocument();
  });
});
