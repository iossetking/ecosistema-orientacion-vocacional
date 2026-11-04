import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExportWorkspace from "@/components/export/ExportWorkspace";
import { MatrixProvider } from "@/hooks/useRealtimeMatrix";
import type { MatrixSnapshot } from "@/types/matrix";

vi.mock("@/lib/export/pdf", () => ({
  exportElementToPdf: vi.fn().mockResolvedValue(undefined),
}));

const snapshot: MatrixSnapshot = {
  records: [],
  actionTypes: [],
  modalities: [],
  dependencies: [],
};

describe("ExportWorkspace", () => {
  it("renderiza opciones de exportación", () => {
    render(
      <MatrixProvider initial={snapshot}>
        <ExportWorkspace />
      </MatrixProvider>,
    );
    expect(screen.getByRole("button", { name: /exportar matriz/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exportar an[aá]lisis/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exportar todo/i })).toBeInTheDocument();
  });
});