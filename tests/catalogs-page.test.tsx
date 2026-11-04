import { render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";
import { MatrixProvider } from "@/hooks/useRealtimeMatrix";
import CatalogManager from "@/components/catalogs/CatalogManager";
import type { MatrixSnapshot } from "@/types/matrix";

vi.mock("@/app/actions/catalogs", () => ({
  createCatalogItem: vi.fn().mockResolvedValue({ ok: true }),
  updateCatalogItem: vi.fn().mockResolvedValue({ ok: true }),
  swapCatalogItems: vi.fn().mockResolvedValue({ ok: true }),
  deleteCatalogItem: vi.fn().mockResolvedValue({ ok: true }),
}));

const snapshot: MatrixSnapshot = {
  records: [],
  actionTypes: [
    { id: "t1", name: "Test vocacionales", sort_order: 1, is_active: true },
    { id: "t2", name: "Asesorías personalizadas", sort_order: 2, is_active: true },
  ],
  modalities: [{ id: "m1", name: "Presencial", sort_order: 1, is_active: true }],
  dependencies: [{ id: "d1", name: "SEMS", code: "SEMS", sort_order: 1, is_active: true }],
};

describe("CatalogManager", () => {
  it("muestra los tres paneles con sus elementos", () => {
    render(
      <MatrixProvider initial={snapshot}>
        <CatalogManager />
      </MatrixProvider>,
    );
    expect(screen.getByText(/Tipos de acción o recurso/i)).toBeInTheDocument();
    expect(screen.getByText(/Modalidades/i)).toBeInTheDocument();
    expect(screen.getByText(/Dependencias participantes/i)).toBeInTheDocument();
    expect(screen.getByText("Test vocacionales")).toBeInTheDocument();
    expect(screen.getByText("Asesorías personalizadas")).toBeInTheDocument();
    expect(screen.getByText("SEMS")).toBeInTheDocument();
  });

  it("tiene formulario para agregar elementos nuevos", () => {
    render(
      <MatrixProvider initial={snapshot}>
        <CatalogManager />
      </MatrixProvider>,
    );
    const inputs = screen.getAllByPlaceholderText(/nuevo elemento/i);
    expect(inputs).toHaveLength(3);
    const addButtons = screen.getAllByRole("button", { name: /agregar/i });
    expect(addButtons.length).toBeGreaterThanOrEqual(3);
  });
});
