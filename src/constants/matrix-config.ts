import type { RecordStatus } from "@/types/matrix";

export interface StageDef {
  id: number;
  key: string;
  name: string;
  subtitle: string;
  level: string;
  color: string;
  iconName: string;
}

export interface DimensionDef {
  id: number;
  key: string;
  name: string;
  question: string;
  iconName: string;
  extended: boolean;
}

export interface StatusDef {
  key: RecordStatus;
  label: string;
  color: string;
}

export const STAGES: StageDef[] = [
  { id: 1, key: "etapa_1", name: "1. Autoconocimiento", subtitle: "Primer año del Bachillerato General", level: "Media Superior — 1er año", color: "#c8f59b", iconName: "Compass" },
  { id: 2, key: "etapa_2", name: "2. Exploración educativa y profesional", subtitle: "Segundo año del bachillerato", level: "Media Superior — 2do año", color: "#a8edea", iconName: "Search" },
  { id: 3, key: "etapa_3", name: "3. Decisión y planificación de carrera", subtitle: "Tercer año del bachillerato", level: "Media Superior — 3er año", color: "#fde68a", iconName: "Target" },
  { id: 4, key: "etapa_4", name: "4. Preparación y transición", subtitle: "Egreso y transición a la educación superior u otras alternativas", level: "Transición / Admisión", color: "#e9d5ff", iconName: "ArrowLeftRight" },
  { id: 5, key: "etapa_5", name: "5. Permanencia y arraigo", subtitle: "Primer año de licenciatura", level: "Superior — 1er año", color: "#bfdbfe", iconName: "Anchor" },
];

export const DIMENSIONS: DimensionDef[] = [
  { id: 1, key: "necesidades", name: "Necesidades del estudiante", question: "¿Qué requiere el estudiantado en esta etapa?", iconName: "Users", extended: false },
  { id: 2, key: "caracteristicas", name: "Características y condiciones", question: "¿Qué características o condiciones influyen en la trayectoria?", iconName: "SlidersHorizontal", extended: false },
  { id: 3, key: "acciones_recursos", name: "Acciones y recursos actuales", question: "¿Qué se ofrece, quién lo organiza y cómo se realiza?", iconName: "Briefcase", extended: true },
  { id: 4, key: "datos_seguimiento", name: "Datos y seguimiento", question: "¿Qué información se genera y qué información se requiere?", iconName: "Database", extended: false },
  { id: 5, key: "vacios_barreras", name: "Vacíos o barreras", question: "¿Qué falta o dificulta avanzar?", iconName: "TriangleAlert", extended: false },
  { id: 6, key: "areas_articulacion", name: "Áreas de articulación", question: "¿Qué acciones, recursos o dependencias podrían vincularse?", iconName: "Network", extended: false },
  { id: 7, key: "mejoras_propuestas", name: "Mejoras propuestas", question: "¿Qué debería fortalecerse, actualizarse o desarrollarse?", iconName: "Lightbulb", extended: false },
];

export const STATUSES: StatusDef[] = [
  { key: "no_existe", label: "No existe", color: "#ef4444" },
  { key: "no_funciona", label: "No funciona", color: "#f97316" },
  { key: "posible_duplicado", label: "Posible Duplicado", color: "#a855f7" },
  { key: "existe_y_funciona", label: "Existe y Funciona", color: "#10b981" },
  { key: "requiere_fortalecimiento", label: "Requiere fortalecimiento o actualización", color: "#3b82f6" },
  { key: "sin_clasificar", label: "Sin clasificar", color: "#9ca3af" },
];

export const ACTIONS_DIMENSION_ID = 3;

export const DEPENDENCY_SEED_NAMES = [
  "SEMS",
  "CGAI",
  "CSE",
  "Centros Universitarios",
  "Escuelas Preparatorias",
  "Otros",
] as const;

export function getStage(id: number): StageDef | undefined {
  return STAGES.find((s) => s.id === id);
}

export function getDimension(id: number): DimensionDef | undefined {
  return DIMENSIONS.find((d) => d.id === id);
}

export function getStatus(key: RecordStatus | null): StatusDef | undefined {
  if (key === null) return undefined;
  return STATUSES.find((s) => s.key === key);
}
