import type { CatalogKind } from "@/types/matrix";

export const CATALOG_TABLES: Record<CatalogKind, string> = {
  action_types: "catalog_action_types",
  modalities: "catalog_modalities",
  dependencies: "catalog_dependencies",
};
