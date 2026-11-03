# Ecosistema de Orientación Vocacional — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicación web colaborativa en tiempo real (matriz 5 etapas × 7 dimensiones, catálogos administrables, análisis con grafo de nodos y gráficas) desplegada en Vercel sobre Next.js 15 + Supabase, con acceso blindado por PIN y trazabilidad de autoría.

**Architecture:** Next.js App Router (TypeScript, `src/`). Datos y Realtime en Supabase (PostgreSQL). Lecturas iniciales vía Server Components con service role; mutaciones vía Server Actions que verifican una cookie de sesión JWT firmada (`jose`, HS256, `SESSION_SECRET`); sincronización en vivo vía canal `postgres_changes` autenticado con un JWT `role: authenticated` firmado con `SUPABASE_JWT_SECRET`. RLS bloquea todo acceso `anon`.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, @supabase/supabase-js, jose, react-hook-form + zod + @hookform/resolvers, @xyflow/react, d3-force, recharts, vitest + @testing-library/react + jsdom.

**Especificación:** `PLAN_IMPLEMENTACION.md` (raíz del repositorio). Leerla antes de empezar.

**Convenciones globales:**
- Alias de importación `@/` → `src/`.
- Antes de cada commit: `npm test` y `npx tsc --noEmit` deben pasar (salvo tareas indicadas).
- Idioma de UI y mensajes: español.
- Si un test no falla como se espera en el paso "verificar que falla", NO lo marques; investiga.

---

### Task 1: Scaffold del proyecto y tooling de pruebas

**Files:**
- Create: `package.json` (vía create-next-app), `vitest.config.ts`, `tests/setup.ts`, `.env.example`, `components.json` (vía shadcn), `src/components/ui/*`

- [ ] **Step 1: Crear el proyecto Next.js 15**

El directorio ya contiene `.git`, `PLAN_IMPLEMENTACION.md` y `docs/`; create-next-app lo permite. Ejecutar:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: proyecto creado sin errores; `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css` presentes.

- [ ] **Step 2: Instalar dependencias de runtime**

```bash
npm i @supabase/supabase-js jose react-hook-form zod @hookform/resolvers @xyflow/react d3-force recharts lucide-react clsx tailwind-merge
```

- [ ] **Step 3: Inicializar shadcn/ui y agregar componentes**

```bash
npx shadcn@latest init --yes -b neutral
npx shadcn@latest add button input textarea select checkbox label dialog sheet badge card switch separator --yes
```

Expected: `src/components/ui/*` con los componentes listados y `components.json` en la raíz.

- [ ] **Step 4: Instalar tooling de pruebas**

```bash
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/d3-force
```

- [ ] **Step 5: Crear `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 6: Crear `tests/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;
```

- [ ] **Step 7: Agregar script de test en `package.json`**

En `"scripts"` agregar: `"test": "vitest run"`.

- [ ] **Step 8: Crear `.env.example`**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SUPABASE_JWT_SECRET=tu-jwt-secret-de-supabase

# Acceso
ACCESS_PIN=1234
SESSION_SECRET=cadena-aleatoria-de-al-menos-32-caracteres
```

- [ ] **Step 9: Verificar que compila**

```bash
npx tsc --noEmit && npm run lint
```

Expected: sin errores.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js 15 + Tailwind + shadcn/ui + vitest"
```

---

### Task 2: Esquema y semilla de Supabase

**Files:**
- Create: `supabase/schema.sql`, `supabase/seed.sql`

- [ ] **Step 1: Crear `supabase/schema.sql`**

```sql
-- Ecosistema de Orientación Vocacional — esquema
CREATE TYPE record_status AS ENUM (
  'no_existe',
  'no_funciona',
  'posible_duplicado',
  'existe_y_funciona',
  'requiere_fortalecimiento',
  'sin_clasificar'
);

CREATE TABLE catalog_action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_modalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matrix_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id SMALLINT NOT NULL CHECK (dimension_id BETWEEN 1 AND 7),
  primary_stage_id SMALLINT NOT NULL CHECK (primary_stage_id BETWEEN 1 AND 5),
  related_stage_ids SMALLINT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  status record_status NOT NULL DEFAULT 'sin_clasificar',
  action_name TEXT,
  action_type_id UUID REFERENCES catalog_action_types(id) ON DELETE SET NULL,
  organizer TEXT,
  executor TEXT,
  modality_id UUID REFERENCES catalog_modalities(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_by_dependency TEXT NOT NULL,
  updated_by_name TEXT NOT NULL,
  updated_by_dependency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE record_dependencies (
  record_id UUID NOT NULL REFERENCES matrix_records(id) ON DELETE CASCADE,
  dependency_id UUID NOT NULL REFERENCES catalog_dependencies(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, dependency_id)
);

CREATE INDEX idx_matrix_records_dimension ON matrix_records(dimension_id);
CREATE INDEX idx_matrix_records_stage ON matrix_records(primary_stage_id);
CREATE INDEX idx_record_dependencies_dependency ON record_dependencies(dependency_id);

-- Seguridad: bloqueo total al rol anon; solo sesiones authenticated (PIN validado)
ALTER TABLE matrix_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read matrix_records" ON matrix_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read record_dependencies" ON record_dependencies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read catalog_action_types" ON catalog_action_types
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read catalog_modalities" ON catalog_modalities
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated read catalog_dependencies" ON catalog_dependencies
  FOR SELECT TO authenticated USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE matrix_records;
ALTER PUBLICATION supabase_realtime ADD TABLE record_dependencies;
ALTER PUBLICATION supabase_realtime ADD TABLE catalog_action_types;
ALTER PUBLICATION supabase_realtime ADD TABLE catalog_modalities;
ALTER PUBLICATION supabase_realtime ADD TABLE catalog_dependencies;
```

- [ ] **Step 2: Crear `supabase/seed.sql`**

```sql
INSERT INTO catalog_dependencies (name, code, sort_order) VALUES
  ('SEMS', 'SEMS', 1),
  ('CGAI', 'CGAI', 2),
  ('CSE', 'CSE', 3),
  ('Centros Universitarios', 'CU', 4),
  ('Escuelas Preparatorias', 'PREPA', 5),
  ('Otros', 'OTROS', 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_action_types (name, sort_order) VALUES
  ('Test vocacionales', 1),
  ('Asesorías personalizadas', 2),
  ('Talleres o charlas', 3),
  ('Cursos o simuladores', 4),
  ('Ferias y exposiciones', 5),
  ('Otras', 6)
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_modalities (name, sort_order) VALUES
  ('Presencial', 1),
  ('Virtual', 2),
  ('Híbrida', 3),
  ('Autogestiva', 4)
ON CONFLICT (name) DO NOTHING;
```

- [ ] **Step 3: Verificación (si hay acceso al proyecto Supabase)**

En el SQL Editor del proyecto Supabase ejecutar `schema.sql` y luego `seed.sql`; confirmar `SELECT count(*) FROM catalog_dependencies;` → 6. Si aún no hay proyecto, anotar que debe ejecutarse antes del primer arranque local (Task 18 lo recuerda).

- [ ] **Step 4: Commit**

```bash
git add supabase && git commit -m "feat(db): esquema SQL con RLS, realtime y semilla de catálogos"
```

---

### Task 3: Configuración de dominio, tipos y esquemas Zod

**Files:**
- Create: `src/types/matrix.ts`, `src/constants/matrix-config.ts`
- Test: `tests/matrix-config.test.ts`, `tests/matrix-schemas.test.ts`

- [ ] **Step 1: Escribir tests de configuración (fallan primero)**

`tests/matrix-config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  STAGES,
  DIMENSIONS,
  STATUSES,
  ACTIONS_DIMENSION_ID,
  getStage,
  getDimension,
  getStatus,
} from "@/constants/matrix-config";

describe("matrix-config", () => {
  it("define exactamente 5 etapas con ids 1..5", () => {
    expect(STAGES).toHaveLength(5);
    expect(STAGES.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it("define exactamente 7 dimensiones con ids 1..7", () => {
    expect(DIMENSIONS).toHaveLength(7);
    expect(DIMENSIONS.map((d) => d.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("define exactamente 6 estados de registro", () => {
    expect(STATUSES).toHaveLength(6);
  });

  it("la dimensión extendida es la 3 (Acciones y recursos actuales)", () => {
    expect(ACTIONS_DIMENSION_ID).toBe(3);
    expect(DIMENSIONS.find((d) => d.id === 3)?.extended).toBe(true);
  });

  it("getStage/getDimension/getStatus regresan definiciones existentes", () => {
    expect(getStage(1)?.key).toBe("etapa_1");
    expect(getDimension(1)?.key).toBe("necesidades");
    expect(getStatus("existe_y_funciona")?.label).toBe("Existe y Funciona");
    expect(getStage(99)).toBeUndefined();
  });
});
```

`tests/matrix-schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  baseRecordFormSchema,
  actionRecordFormSchema,
  getRecordFormSchema,
  pinLoginSchema,
  catalogCreateSchema,
} from "@/types/matrix";

const baseValid = {
  dimensionId: 1,
  primaryStageId: 2,
  relatedStageIds: [3],
  description: "Necesidad de orientación temprana",
  status: "sin_clasificar",
  dependencyIds: ["3f2a1b2c-0000-4000-8000-000000000001"],
};

const actionExtraValid = {
  actionName: "Test vocacional industrial",
  actionTypeId: "3f2a1b2c-0000-4000-8000-000000000002",
  organizer: "SEMS",
  executor: "Preparatorias",
  modalityId: "3f2a1b2c-0000-4000-8000-000000000003",
};

describe("esquemas zod de registros", () => {
  it("valida un registro base", () => {
    expect(baseRecordFormSchema.safeParse(baseValid).success).toBe(true);
  });

  it("rechaza descripción vacía", () => {
    expect(baseRecordFormSchema.safeParse({ ...baseValid, description: "   " }).success).toBe(false);
  });

  it("rechaza etapa fuera de rango", () => {
    expect(baseRecordFormSchema.safeParse({ ...baseValid, primaryStageId: 6 }).success).toBe(false);
  });

  it("rechaza estado inválido", () => {
    expect(baseRecordFormSchema.safeParse({ ...baseValid, status: "aprobado" }).success).toBe(false);
  });

  it("valida registro extendido de dimensión 3", () => {
    expect(actionRecordFormSchema.safeParse({ ...baseValid, ...actionExtraValid }).success).toBe(true);
  });

  it("rechaza registro extendido sin nombre de acción", () => {
    const { actionName, ...rest } = actionExtraValid;
    expect(actionRecordFormSchema.safeParse({ ...baseValid, ...rest }).success).toBe(false);
  });

  it("getRecordFormSchema exige campos extendidos solo para dimensión 3", () => {
    expect(getRecordFormSchema(3).safeParse(baseValid).success).toBe(false);
    expect(getRecordFormSchema(1).safeParse(baseValid).success).toBe(true);
  });
});

describe("pinLoginSchema", () => {
  it("requiere nombre, dependencia y pin", () => {
    expect(pinLoginSchema.safeParse({ name: "Ana", dependency: "SEMS", pin: "1234" }).success).toBe(true);
    expect(pinLoginSchema.safeParse({ name: "A", dependency: "SEMS", pin: "1234" }).success).toBe(false);
    expect(pinLoginSchema.safeParse({ name: "Ana", dependency: "", pin: "1234" }).success).toBe(false);
  });
});

describe("catalogCreateSchema", () => {
  it("requiere nombre no vacío", () => {
    expect(catalogCreateSchema.safeParse({ name: " Test " }).success).toBe(true);
    expect(catalogCreateSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL — no existe `@/constants/matrix-config` ni `@/types/matrix`.

- [ ] **Step 3: Implementar `src/types/matrix.ts`**

```ts
import { z } from "zod";

export type RecordStatus =
  | "no_existe"
  | "no_funciona"
  | "posible_duplicado"
  | "existe_y_funciona"
  | "requiere_fortalecimiento"
  | "sin_clasificar";

export interface CatalogActionType {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CatalogModality {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface CatalogDependency {
  id: string;
  name: string;
  code: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SessionUser {
  name: string;
  dependency: string;
}

export interface MatrixRecord {
  id: string;
  dimension_id: number;
  primary_stage_id: number;
  related_stage_ids: number[];
  description: string;
  status: RecordStatus;
  action_name: string | null;
  action_type_id: string | null;
  organizer: string | null;
  executor: string | null;
  modality_id: string | null;
  created_by_name: string;
  created_by_dependency: string;
  updated_by_name: string;
  updated_by_dependency: string;
  created_at: string;
  updated_at: string;
  dependency_ids: string[];
}

export type CatalogKind = "action_types" | "modalities" | "dependencies";

export interface MatrixSnapshot {
  records: MatrixRecord[];
  actionTypes: CatalogActionType[];
  modalities: CatalogModality[];
  dependencies: CatalogDependency[];
}

export const recordStatusSchema = z.enum([
  "no_existe",
  "no_funciona",
  "posible_duplicado",
  "existe_y_funciona",
  "requiere_fortalecimiento",
  "sin_clasificar",
]);

export const baseRecordFormSchema = z.object({
  dimensionId: z.number().int().min(1).max(7),
  primaryStageId: z.number().int().min(1).max(5),
  relatedStageIds: z.array(z.number().int().min(1).max(5)).max(5).default([]),
  description: z.string().trim().min(1, "La descripción es obligatoria").max(2000),
  status: recordStatusSchema,
  dependencyIds: z.array(z.string().uuid()).default([]),
});

export const actionRecordFormSchema = baseRecordFormSchema.extend({
  actionName: z.string().trim().min(1, "El nombre de la acción es obligatorio").max(200),
  actionTypeId: z.string().uuid("Selecciona un tipo de acción o recurso"),
  organizer: z.string().trim().min(1, "Indica quién lo organiza").max(200),
  executor: z.string().trim().min(1, "Indica quién lo aplica o ejecuta").max(200),
  modalityId: z.string().uuid("Selecciona una modalidad"),
});

export function getRecordFormSchema(dimensionId: number) {
  return dimensionId === 3 ? actionRecordFormSchema : baseRecordFormSchema;
}

export type RecordFormValues = z.infer<typeof baseRecordFormSchema>;
export type ActionRecordFormValues = z.infer<typeof actionRecordFormSchema>;

export const pinLoginSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(100),
  dependency: z.string().trim().min(1, "Indica tu dependencia").max(120),
  pin: z.string().trim().min(4, "El PIN debe tener al menos 4 caracteres").max(12),
});

export type PinLoginValues = z.infer<typeof pinLoginSchema>;

export const catalogCreateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
});
```

- [ ] **Step 4: Implementar `src/constants/matrix-config.ts`**

```ts
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

export function getStatus(key: RecordStatus): StatusDef | undefined {
  return STATUSES.find((s) => s.key === key);
}
```

- [ ] **Step 5: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types src/constants tests && git commit -m "feat(domain): etapas, dimensiones, estados y esquemas zod de registros"
```

---

### Task 4: Librería de autenticación (sesión, JWT de Supabase, rate limit, protección)

**Files:**
- Create: `src/lib/auth/session.ts`, `src/lib/auth/supabase-jwt.ts`, `src/lib/auth/rate-limit.ts`, `src/lib/auth/protect.ts`
- Test: `tests/auth.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

`tests/auth.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE, createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-jwt";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { shouldProtectPath } from "@/lib/auth/protect";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sesión firmada (jose HS256)", () => {
  it("crea y verifica un token de sesión", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const token = await createSessionToken({ name: "Ana García", dependency: "CGAI" });
    expect(typeof token).toBe("string");
    const user = await verifySessionToken(token);
    expect(user).toEqual({ name: "Ana García", dependency: "CGAI" });
  });

  it("regresa null con token alterado o vacío", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    expect(await verifySessionToken(null)).toBeNull();
    const token = await createSessionToken({ name: "Ana", dependency: "SEMS" });
    expect(await verifySessionToken(`${token}x`)).toBeNull();
  });

  it("regresa null si la firma proviene de otro secreto", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const token = await createSessionToken({ name: "Ana", dependency: "SEMS" });
    vi.stubEnv("SESSION_SECRET", "y".repeat(32));
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("expone el nombre de la cookie", () => {
    expect(SESSION_COOKIE).toBe("eov_session");
  });
});

describe("JWT de Supabase para Realtime", () => {
  it("firma un JWT decodificable con rol authenticated", async () => {
    vi.stubEnv("SUPABASE_JWT_SECRET", "jwt-secret-de-prueba-1234567890");
    const token = await createSupabaseAccessToken();
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    expect(payload.role).toBe("authenticated");
    expect(typeof payload.exp).toBe("number");
  });

  it("lanza error sin SUPABASE_JWT_SECRET", async () => {
    vi.stubEnv("SUPABASE_JWT_SECRET", "");
    await expect(createSupabaseAccessToken()).rejects.toThrow();
  });
});

describe("rate limiter", () => {
  it("permite hasta el límite y bloquea después", () => {
    const key = "pin:test";
    resetRateLimit(key);
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, 5, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("reinicia la ventana cuando expira", () => {
    const key = "pin:expired";
    resetRateLimit(key);
    const now = Date.now();
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000, now);
    const after = checkRateLimit(key, 5, 60_000, now + 61_000);
    expect(after.allowed).toBe(true);
  });
});

describe("shouldProtectPath", () => {
  it("protege rutas de la app", () => {
    expect(shouldProtectPath("/")).toBe(true);
    expect(shouldProtectPath("/analisis")).toBe(true);
    expect(shouldProtectPath("/catalogos")).toBe(true);
  });
  it("no protege acceso ni auth ni estáticos", () => {
    expect(shouldProtectPath("/acceso")).toBe(false);
    expect(shouldProtectPath("/api/auth/pin")).toBe(false);
    expect(shouldProtectPath("/_next/static/app.js")).toBe(false);
    expect(shouldProtectPath("/favicon.ico")).toBe(false);
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL — módulos `@/lib/auth/*` no existen.

- [ ] **Step 3: Implementar `src/lib/auth/session.ts`**

```ts
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/types/matrix";

export const SESSION_COOKIE = "eov_session";
const ALG = "HS256";

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET no configurada o demasiado corta (mínimo 16 caracteres)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, dependency: user.dependency })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret());
}

export async function verifySessionToken(
  token: string | null | undefined,
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (typeof payload.name !== "string" || typeof payload.dependency !== "string") return null;
    return { name: payload.name, dependency: payload.dependency };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Implementar `src/lib/auth/supabase-jwt.ts`**

```ts
import { SignJWT } from "jose";

export const PIN_SESSION_SUB = "00000000-0000-4000-8000-000000000000";
const ALG = "HS256";

export async function createSupabaseAccessToken(): Promise<string> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET no configurada");
  }
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(PIN_SESSION_SUB)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(new TextEncoder().encode(secret));
}
```

- [ ] **Step 5: Implementar `src/lib/auth/rate-limit.ts`**

```ts
export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000,
  now: number = Date.now(),
): RateLimitResult {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
```

- [ ] **Step 6: Implementar `src/lib/auth/protect.ts`**

```ts
export function shouldProtectPath(pathname: string): boolean {
  if (pathname.startsWith("/acceso")) return false;
  if (pathname.startsWith("/api/auth")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico") return false;
  return true;
}
```

- [ ] **Step 7: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth tests/auth.test.ts && git commit -m "feat(auth): sesión JWT, token de Supabase, rate limit y protección de rutas"
```

---

### Task 5: Rutas de API de autenticación y middleware

**Files:**
- Create: `src/app/api/auth/pin/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/token/route.ts`, `src/middleware.ts`
- Test: `tests/auth-routes.test.ts`, `tests/middleware.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

`tests/auth-routes.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => vi.unstubAllEnvs());

function pinRequest(body: unknown, ip: string) {
  return new NextRequest("http://localhost/api/auth/pin", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });
}

describe("POST /api/auth/pin", () => {
  it("rechaza PIN incorrecto con 401", async () => {
    vi.stubEnv("ACCESS_PIN", "4321");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { POST } = await import("@/app/api/auth/pin/route");
    const res = await POST(pinRequest({ name: "Ana", dependency: "SEMS", pin: "1111" }, "ip-pin-1"));
    expect(res.status).toBe(401);
  });

  it("acepta PIN correcto y setea cookie httpOnly", async () => {
    vi.stubEnv("ACCESS_PIN", "4321");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { POST } = await import("@/app/api/auth/pin/route");
    const res = await POST(pinRequest({ name: "Ana", dependency: "SEMS", pin: "4321" }, "ip-pin-2"));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("eov_session=");
    expect(setCookie).toContain("HttpOnly");
  });

  it("rechaza cuerpo inválido con 400", async () => {
    vi.stubEnv("ACCESS_PIN", "4321");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { POST } = await import("@/app/api/auth/pin/route");
    const res = await POST(pinRequest({ name: "A", dependency: "", pin: "1" }, "ip-pin-3"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/token", () => {
  it("regresa 401 sin cookie de sesión", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    vi.stubEnv("SUPABASE_JWT_SECRET", "jwt-secret-de-prueba-1234567890");
    const { GET } = await import("@/app/api/auth/token/route");
    const res = await GET(new NextRequest("http://localhost/api/auth/token"));
    expect(res.status).toBe(401);
  });

  it("regresa un token con sesión válida", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    vi.stubEnv("SUPABASE_JWT_SECRET", "jwt-secret-de-prueba-1234567890");
    const { createSessionToken } = await import("@/lib/auth/session");
    const token = await createSessionToken({ name: "Ana", dependency: "SEMS" });
    const { GET } = await import("@/app/api/auth/token/route");
    const req = new NextRequest("http://localhost/api/auth/token", {
      headers: { cookie: `eov_session=${token}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string };
    expect(body.token.split(".")).toHaveLength(3);
  });
});
```

`tests/middleware.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

afterEach(() => vi.unstubAllEnvs());

describe("middleware", () => {
  it("redirige a /acceso sin sesión", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { middleware } = await import("@/middleware");
    const res = await middleware(new NextRequest("http://localhost/analisis"));
    expect(res.headers.get("location")).toContain("/acceso?next=%2Fanalisis");
  });

  it("redirige la raíz sin sesión", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { middleware } = await import("@/middleware");
    const res = await middleware(new NextRequest("http://localhost/"));
    expect(res.headers.get("location")).toContain("/acceso");
  });

  it("deja pasar con sesión válida", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { createSessionToken } = await import("@/lib/auth/session");
    const token = await createSessionToken({ name: "Ana", dependency: "SEMS" });
    const { middleware } = await import("@/middleware");
    const req = new NextRequest("http://localhost/catalogos", {
      headers: { cookie: `eov_session=${token}` },
    });
    const res = await middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });

  it("no bloquea /acceso ni /api/auth", async () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    const { middleware } = await import("@/middleware");
    expect((await middleware(new NextRequest("http://localhost/acceso"))).headers.get("location")).toBeNull();
    expect(
      (await middleware(new NextRequest("http://localhost/api/auth/pin"))).headers.get("location"),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL — rutas y middleware no existen.

- [ ] **Step 3: Implementar `src/app/api/auth/pin/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { pinLoginSchema } from "@/types/matrix";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rate = checkRateLimit(`pin:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = pinLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos incompletos" },
      { status: 400 },
    );
  }

  const expected = process.env.ACCESS_PIN;
  if (!expected) {
    return NextResponse.json({ error: "Servidor sin ACCESS_PIN configurado" }, { status: 500 });
  }
  if (parsed.data.pin !== expected) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const token = await createSessionToken({
    name: parsed.data.name,
    dependency: parsed.data.dependency,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
```

- [ ] **Step 4: Implementar `src/app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
```

- [ ] **Step 5: Implementar `src/app/api/auth/token/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { createSupabaseAccessToken } from "@/lib/auth/supabase-jwt";

export async function GET(req: NextRequest) {
  const user = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
  }
  const token = await createSupabaseAccessToken();
  return NextResponse.json({ token });
}
```

- [ ] **Step 6: Implementar `src/middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { shouldProtectPath } from "@/lib/auth/protect";

export async function middleware(req: NextRequest) {
  if (!shouldProtectPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  const user = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/acceso";
    url.search = "";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 7: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/api src/middleware.ts tests/auth-routes.test.ts tests/middleware.test.ts && git commit -m "feat(auth): rutas de PIN/logout/token y middleware de protección"
```

---

### Task 6: Pantalla de acceso `/acceso`

**Files:**
- Create: `src/app/acceso/page.tsx`
- Test: `tests/acceso-page.test.tsx`

- [ ] **Step 1: Escribir test que falla**

`tests/acceso-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import AccesoPage from "@/app/acceso/page";

describe("AccesoPage", () => {
  it("muestra campos de nombre, dependencia y PIN", () => {
    render(<AccesoPage />);
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dependencia/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pin/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr test y verificar que falla**

```bash
npm test
```

Expected: FAIL — no existe `@/app/acceso/page`.

- [ ] **Step 3: Implementar `src/app/acceso/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEPENDENCY_SEED_NAMES } from "@/constants/matrix-config";

export default function AccesoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [dependency, setDependency] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, dependency, pin }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "No se pudo iniciar sesión");
        return;
      }
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-8 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Ecosistema de Orientación Vocacional
          </h1>
          <p className="text-sm text-slate-500">
            Ingresa tus datos y el PIN de la sesión para colaborar en tiempo real.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ana García"
            required
            minLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dependency">Dependencia</Label>
          <Input
            id="dependency"
            value={dependency}
            onChange={(e) => setDependency(e.target.value)}
            placeholder="Ej. SEMS, CGAI, CSE…"
            list="dependency-options"
            required
          />
          <datalist id="dependency-options">
            {DEPENDENCY_SEED_NAMES.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">PIN de acceso</Label>
          <Input
            id="pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            minLength={4}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Validando…" : "Ingresar"}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Correr test y verificar que pasa**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/acceso tests/acceso-page.test.tsx && git commit -m "feat(auth): pantalla de acceso con nombre, dependencia y PIN"
```

---

### Task 7: Clientes Supabase y capa de datos del servidor

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/data.ts`
- Test: `tests/data.test.ts`

- [ ] **Step 1: Escribir test que falla**

`tests/data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { rowToRecord } from "@/lib/data";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  dimension_id: 3,
  primary_stage_id: 2,
  related_stage_ids: [3],
  description: "Descripción",
  status: "existe_y_funciona",
  action_name: "Test vocacional",
  action_type_id: "22222222-2222-4222-8222-222222222222",
  organizer: "SEMS",
  executor: "Preparatorias",
  modality_id: "33333333-3333-4333-8333-333333333333",
  created_by_name: "Ana",
  created_by_dependency: "CGAI",
  updated_by_name: "Carlos",
  updated_by_dependency: "SEMS",
  created_at: "2026-11-03T10:15:00Z",
  updated_at: "2026-11-03T11:40:00Z",
};

describe("rowToRecord", () => {
  it("convierte una fila de BD a MatrixRecord conservando dependencias previas", () => {
    const record = rowToRecord(row, ["44444444-4444-4444-8444-444444444444"]);
    expect(record.id).toBe(row.id);
    expect(record.status).toBe("existe_y_funciona");
    expect(record.dependency_ids).toEqual(["44444444-4444-4444-8444-444444444444"]);
  });

  it("usa lista vacía cuando no hay dependencias previas", () => {
    expect(rowToRecord(row).dependency_ids).toEqual([]);
  });

  it("acepta filas parciales de eventos realtime", () => {
    expect(rowToRecord({ ...row, action_name: null }).action_name).toBeNull();
  });
});
```

- [ ] **Step 2: Correr test y verificar que falla**

```bash
npm test
```

Expected: FAIL — no existe `@/lib/data`.

- [ ] **Step 3: Implementar `src/lib/supabase/server.ts`**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
```

- [ ] **Step 4: Implementar `src/lib/supabase/client.ts`**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getBrowserSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, detectSessionInUrl: false },
  });
}
```

- [ ] **Step 5: Implementar `src/lib/data.ts`**

```ts
import { getServerSupabase } from "@/lib/supabase/server";
import type { CatalogDependency, MatrixRecord, MatrixSnapshot, RecordStatus } from "@/types/matrix";

export interface RecordRow {
  id: string;
  dimension_id: number;
  primary_stage_id: number;
  related_stage_ids: number[];
  description: string;
  status: RecordStatus;
  action_name: string | null;
  action_type_id: string | null;
  organizer: string | null;
  executor: string | null;
  modality_id: string | null;
  created_by_name: string;
  created_by_dependency: string;
  updated_by_name: string;
  updated_by_dependency: string;
  created_at: string;
  updated_at: string;
}

export interface LinkRow {
  record_id: string;
  dependency_id: string;
}

export function rowToRecord(row: RecordRow, previousDependencyIds: string[] = []): MatrixRecord {
  return { ...row, dependency_ids: previousDependencyIds };
}

export async function getMatrixSnapshot(): Promise<MatrixSnapshot> {
  const sb = getServerSupabase();
  const [recordsRes, linksRes, actionTypesRes, modalitiesRes, dependenciesRes] = await Promise.all([
    sb.from("matrix_records").select("*"),
    sb.from("record_dependencies").select("record_id, dependency_id"),
    sb.from("catalog_action_types").select("*").order("sort_order"),
    sb.from("catalog_modalities").select("*").order("sort_order"),
    sb.from("catalog_dependencies").select("*").order("sort_order"),
  ]);

  const links = (linksRes.data ?? []) as LinkRow[];
  const linksByRecord = new Map<string, string[]>();
  for (const link of links) {
    const list = linksByRecord.get(link.record_id) ?? [];
    list.push(link.dependency_id);
    linksByRecord.set(link.record_id, list);
  }

  const records = ((recordsRes.data ?? []) as RecordRow[]).map((row) =>
    rowToRecord(row, linksByRecord.get(row.id) ?? []),
  );

  return {
    records,
    actionTypes: actionTypesRes.data ?? [],
    modalities: modalitiesRes.data ?? [],
    dependencies: (dependenciesRes.data ?? []) as CatalogDependency[],
  };
}
```

- [ ] **Step 6: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib tests/data.test.ts && git commit -m "feat(data): clientes Supabase y snapshot inicial del servidor"
```

---

### Task 8: Motor de sincronización en vivo (provider Realtime)

**Files:**
- Create: `src/hooks/useRealtimeMatrix.tsx`
- Modify: `src/app/layout.tsx`
- Test: `tests/realtime-apply.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

`tests/realtime-apply.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyRecordEvent, applyLinkEvent, applyCatalogEvent } from "@/hooks/useRealtimeMatrix";
import type { CatalogDependency, MatrixRecord } from "@/types/matrix";

const base: MatrixRecord = {
  id: "r1",
  dimension_id: 1,
  primary_stage_id: 1,
  related_stage_ids: [],
  description: "Original",
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
  dependency_ids: ["d1"],
};

const rowOf = (over: Record<string, unknown>) => ({ ...base, ...over });

describe("applyRecordEvent", () => {
  it("INSERT agrega el registro", () => {
    const out = applyRecordEvent([base], "INSERT", rowOf({ id: "r2", description: "Nuevo" }));
    expect(out).toHaveLength(2);
  });

  it("UPDATE reemplaza el registro y conserva sus dependencias actuales", () => {
    const out = applyRecordEvent([base], "UPDATE", rowOf({ id: "r1", description: "Editado" }));
    expect(out[0].description).toBe("Editado");
    expect(out[0].dependency_ids).toEqual(["d1"]);
  });

  it("DELETE elimina el registro", () => {
    const out = applyRecordEvent([base], "DELETE", { id: "r1" });
    expect(out).toHaveLength(0);
  });
});

describe("applyLinkEvent", () => {
  it("INSERT de vínculo agrega la dependencia al registro", () => {
    const out = applyLinkEvent([base], "INSERT", "r1", "d2");
    expect(out[0].dependency_ids).toEqual(["d1", "d2"]);
  });

  it("DELETE de vínculo quita la dependencia del registro", () => {
    const out = applyLinkEvent([base], "DELETE", "r1", "d1");
    expect(out[0].dependency_ids).toEqual([]);
  });

  it("ignora vínculos de registros desconocidos", () => {
    const out = applyLinkEvent([base], "INSERT", "otro", "d2");
    expect(out[0].dependency_ids).toEqual(["d1"]);
  });
});

describe("applyCatalogEvent", () => {
  const deps: CatalogDependency[] = [
    { id: "d1", name: "SEMS", code: "SEMS", sort_order: 1, is_active: true },
  ];

  it("INSERT agrega ítem", () => {
    const nuevo: CatalogDependency = { id: "d2", name: "CGAI", code: null, sort_order: 2, is_active: true };
    expect(applyCatalogEvent(deps, "INSERT", nuevo)).toHaveLength(2);
  });

  it("UPDATE reemplaza por id", () => {
    const editado = { ...deps[0], name: "SEMS Actualizado" };
    const out = applyCatalogEvent(deps, "UPDATE", editado);
    expect(out[0].name).toBe("SEMS Actualizado");
  });

  it("DELETE elimina por id", () => {
    expect(applyCatalogEvent(deps, "DELETE", { id: "d1" })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL — no existe `@/hooks/useRealtimeMatrix`.

- [ ] **Step 3: Implementar `src/hooks/useRealtimeMatrix.tsx`**

```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CatalogActionType,
  CatalogDependency,
  CatalogModality,
  MatrixRecord,
  MatrixSnapshot,
} from "@/types/matrix";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { rowToRecord, type RecordRow } from "@/lib/data";

export type ConnectionStatus = "connecting" | "live" | "offline";

export function applyRecordEvent(
  records: MatrixRecord[],
  event: "INSERT" | "UPDATE" | "DELETE",
  row: RecordRow & { id: string },
): MatrixRecord[] {
  if (event === "DELETE") {
    return records.filter((r) => r.id !== row.id);
  }
  const existing = records.find((r) => r.id === row.id);
  const converted = rowToRecord(row, existing?.dependency_ids ?? []);
  if (!existing) return [...records, converted];
  return records.map((r) => (r.id === converted.id ? converted : r));
}

export function applyLinkEvent(
  records: MatrixRecord[],
  event: "INSERT" | "DELETE",
  recordId: string,
  dependencyId: string,
): MatrixRecord[] {
  return records.map((r) => {
    if (r.id !== recordId) return r;
    const set = new Set(r.dependency_ids);
    if (event === "INSERT") set.add(dependencyId);
    else set.delete(dependencyId);
    return { ...r, dependency_ids: [...set] };
  });
}

export function applyCatalogEvent<T extends { id: string }>(
  list: T[],
  event: "INSERT" | "UPDATE" | "DELETE",
  row: T,
): T[] {
  if (event === "DELETE") return list.filter((i) => i.id !== row.id);
  const existing = list.find((i) => i.id === row.id);
  if (!existing) return [...list, row];
  return list.map((i) => (i.id === row.id ? row : i));
}

interface MatrixContextValue {
  snapshot: MatrixSnapshot;
  connection: ConnectionStatus;
}

const MatrixContext = createContext<MatrixContextValue | null>(null);

export function MatrixProvider({
  initial,
  children,
}: {
  initial: MatrixSnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<MatrixSnapshot>(initial);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    let cancelled = false;
    let channel: { unsubscribe: () => void } | null = null;

    (async () => {
      let client;
      try {
        client = getBrowserSupabase();
      } catch {
        setConnection("offline");
        return;
      }

      const res = await fetch("/api/auth/token").catch(() => null);
      if (!res || !res.ok) {
        setConnection("offline");
        return;
      }
      const { token } = (await res.json()) as { token: string };
      if (cancelled) return;
      client.realtime.setAuth(token);

      channel = client.channel("eov-matrix");

      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matrix_records" },
        (payload) => {
          const row = (payload.new ?? payload.old) as RecordRow & { id: string };
          setSnapshot((s) => ({
            ...s,
            records: applyRecordEvent(s.records, payload.eventType, row),
          }));
        },
      );

      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "record_dependencies" },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            record_id: string;
            dependency_id: string;
          };
          setSnapshot((s) => ({
            ...s,
            records: applyLinkEvent(
              s.records,
              payload.eventType,
              row.record_id,
              row.dependency_id,
            ),
          }));
        },
      );

      const bindCatalog = (table: string, key: keyof MatrixSnapshot) => {
        channel!.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            const row = (payload.new ?? payload.old) as never;
            setSnapshot((s) => ({
              ...s,
              [key]: applyCatalogEvent(s[key] as { id: string }[], payload.eventType, row),
            }));
          },
        );
      };

      bindCatalog("catalog_action_types", "actionTypes");
      bindCatalog("catalog_modalities", "modalities");
      bindCatalog("catalog_dependencies", "dependencies");

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnection("offline");
        else setConnection("connecting");
      });
    })();

    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ snapshot, connection }), [snapshot, connection]);

  return <MatrixContext.Provider value={value}>{children}</MatrixContext.Provider>;
}

export function useMatrix(): MatrixContextValue {
  const ctx = useContext(MatrixContext);
  if (!ctx) throw new Error("useMatrix debe usarse dentro de MatrixProvider");
  return ctx;
}
```

- [ ] **Step 4: Reescribir `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getMatrixSnapshot } from "@/lib/data";
import { MatrixProvider } from "@/hooks/useRealtimeMatrix";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ecosistema de Orientación Vocacional",
  description:
    "Matriz colaborativa en tiempo real del ecosistema de orientación vocacional (Media Superior → Superior).",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const snapshot = await getMatrixSnapshot();

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}>
        <MatrixProvider initial={snapshot}>{children}</MatrixProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Correr tests y verificar que pasan**

```bash
npm test && npx tsc --noEmit
```

Expected: PASS y sin errores de tipos.

- [ ] **Step 6: Commit**

```bash
git add src/hooks src/app/layout.tsx tests/realtime-apply.test.ts && git commit -m "feat(realtime): provider con eventos postgres_changes y contexto de matriz"
```

---

### Task 9: Server Actions de registros y catálogos

**Files:**
- Create: `src/lib/records/build-row.ts`, `src/lib/catalogs/tables.ts`, `src/app/actions/records.ts`, `src/app/actions/catalogs.ts`
- Test: `tests/build-row.test.ts`

- [ ] **Step 1: Escribir test que falla**

`tests/build-row.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildCreateRow, buildUpdateRow } from "@/lib/records/build-row";
import { CATALOG_TABLES } from "@/lib/catalogs/tables";

const baseInput = {
  dimensionId: 2,
  primaryStageId: 1,
  relatedStageIds: [2],
  description: "Condición socioeconómica",
  status: "requiere_fortalecimiento" as const,
  dependencyIds: ["3f2a1b2c-0000-4000-8000-0000000000aa"],
};

const actionInput = {
  ...baseInput,
  dimensionId: 3,
  actionName: "Taller de decisiones",
  actionTypeId: "3f2a1b2c-0000-4000-8000-0000000000bb",
  organizer: "CGAI",
  executor: "Preparatorias",
  modalityId: "3f2a1b2c-0000-4000-8000-0000000000cc",
};

const user = { name: "Ana", dependency: "CGAI" };

describe("buildCreateRow", () => {
  it("mapea campos base y autoría de creación", () => {
    const row = buildCreateRow(baseInput, user);
    expect(row.dimension_id).toBe(2);
    expect(row.primary_stage_id).toBe(1);
    expect(row.related_stage_ids).toEqual([2]);
    expect(row.status).toBe("requiere_fortalecimiento");
    expect(row.created_by_name).toBe("Ana");
    expect(row.updated_by_dependency).toBe("CGAI");
    expect(row.action_name).toBeNull();
    expect(row.action_type_id).toBeNull();
    expect(row.modality_id).toBeNull();
  });

  it("incluye campos extendidos para dimensión 3", () => {
    const row = buildCreateRow(actionInput, user);
    expect(row.action_name).toBe("Taller de decisiones");
    expect(row.organizer).toBe("CGAI");
    expect(row.modality_id).toBe("3f2a1b2c-0000-4000-8000-0000000000cc");
  });
});

describe("buildUpdateRow", () => {
  it("no incluye campos created_by", () => {
    const row = buildUpdateRow(baseInput, user);
    expect(row).not.toHaveProperty("created_by_name");
    expect(row).not.toHaveProperty("created_by_dependency");
    expect(row.updated_by_name).toBe("Ana");
    expect(row.dimension_id).toBe(2);
  });
});

describe("CATALOG_TABLES", () => {
  it("mapea los tres catálogos a sus tablas", () => {
    expect(CATALOG_TABLES.action_types).toBe("catalog_action_types");
    expect(CATALOG_TABLES.modalities).toBe("catalog_modalities");
    expect(CATALOG_TABLES.dependencies).toBe("catalog_dependencies");
  });
});
```

- [ ] **Step 2: Correr test y verificar que falla**

```bash
npm test
```

Expected: FAIL — no existe `@/lib/records/build-row`.

- [ ] **Step 3: Implementar `src/lib/records/build-row.ts`**

```ts
import { ACTIONS_DIMENSION_ID } from "@/constants/matrix-config";
import type {
  ActionRecordFormValues,
  RecordFormValues,
  RecordStatus,
  SessionUser,
} from "@/types/matrix";

export type AnyRecordFormValues = RecordFormValues | ActionRecordFormValues;

export interface RecordInsertRow {
  dimension_id: number;
  primary_stage_id: number;
  related_stage_ids: number[];
  description: string;
  status: RecordStatus;
  action_name: string | null;
  action_type_id: string | null;
  organizer: string | null;
  executor: string | null;
  modality_id: string | null;
  created_by_name: string;
  created_by_dependency: string;
  updated_by_name: string;
  updated_by_dependency: string;
}

export type RecordUpdateRow = Omit<RecordInsertRow, "created_by_name" | "created_by_dependency">;

function commonFields(input: AnyRecordFormValues) {
  const isAction = input.dimensionId === ACTIONS_DIMENSION_ID;
  const action = isAction ? (input as ActionRecordFormValues) : null;
  return {
    dimension_id: input.dimensionId,
    primary_stage_id: input.primaryStageId,
    related_stage_ids: input.relatedStageIds,
    description: input.description,
    status: input.status,
    action_name: action?.actionName ?? null,
    action_type_id: action?.actionTypeId ?? null,
    organizer: action?.organizer ?? null,
    executor: action?.executor ?? null,
    modality_id: action?.modalityId ?? null,
  };
}

export function buildCreateRow(input: AnyRecordFormValues, user: SessionUser): RecordInsertRow {
  return {
    ...commonFields(input),
    created_by_name: user.name,
    created_by_dependency: user.dependency,
    updated_by_name: user.name,
    updated_by_dependency: user.dependency,
  };
}

export function buildUpdateRow(input: AnyRecordFormValues, user: SessionUser): RecordUpdateRow {
  return {
    ...commonFields(input),
    updated_by_name: user.name,
    updated_by_dependency: user.dependency,
  };
}
```

- [ ] **Step 4: Implementar `src/lib/catalogs/tables.ts`**

```ts
import type { CatalogKind } from "@/types/matrix";

export const CATALOG_TABLES: Record<CatalogKind, string> = {
  action_types: "catalog_action_types",
  modalities: "catalog_modalities",
  dependencies: "catalog_dependencies",
};
```

- [ ] **Step 5: Implementar `src/app/actions/records.ts`**

```ts
"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getRecordFormSchema, type SessionUser } from "@/types/matrix";
import { buildCreateRow, buildUpdateRow, type AnyRecordFormValues } from "@/lib/records/build-row";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

async function parseInput(input: unknown): Promise<AnyRecordFormValues | null> {
  const dimensionId = z
    .number()
    .int()
    .min(1)
    .max(7)
    .safeParse((input as { dimensionId?: number })?.dimensionId);
  if (!dimensionId.success) return null;
  const parsed = getRecordFormSchema(dimensionId.data).safeParse(input);
  return parsed.success ? (parsed.data as AnyRecordFormValues) : null;
}

export async function createRecord(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  const values = await parseInput(input);
  if (!values) return { ok: false, error: "Datos del registro inválidos o incompletos." };

  const sb = getServerSupabase();
  const row = buildCreateRow(values, user);
  const { data, error } = await sb.from("matrix_records").insert(row).select("id").single();
  if (error || !data) return { ok: false, error: "No se pudo guardar el registro." };

  if (values.dependencyIds.length > 0) {
    const links = values.dependencyIds.map((dependency_id) => ({
      record_id: data.id,
      dependency_id,
    }));
    await sb.from("record_dependencies").insert(links);
  }
  return { ok: true };
}

export async function updateRecord(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Registro inválido." };
  const values = await parseInput(input);
  if (!values) return { ok: false, error: "Datos del registro inválidos o incompletos." };

  const sb = getServerSupabase();
  const row = buildUpdateRow(values, user);
  const { error } = await sb.from("matrix_records").update(row).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el registro." };

  await sb.from("record_dependencies").delete().eq("record_id", id);
  if (values.dependencyIds.length > 0) {
    const links = values.dependencyIds.map((dependency_id) => ({
      record_id: id,
      dependency_id,
    }));
    await sb.from("record_dependencies").insert(links);
  }
  return { ok: true };
}

export async function deleteRecord(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Registro inválido." };
  const sb = getServerSupabase();
  const { error } = await sb.from("matrix_records").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el registro." };
  return { ok: true };
}
```

- [ ] **Step 6: Implementar `src/app/actions/catalogs.ts`**

```ts
"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { catalogCreateSchema, type CatalogKind, type SessionUser } from "@/types/matrix";
import { CATALOG_TABLES } from "@/lib/catalogs/tables";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

const kindSchema = z.enum(["action_types", "modalities", "dependencies"]);

export async function createCatalogItem(kind: CatalogKind, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!kindSchema.safeParse(kind).success) return { ok: false, error: "Catálogo inválido." };
  const parsed = catalogCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "El nombre es obligatorio." };

  const sb = getServerSupabase();
  const { data: maxRows } = await sb
    .from(CATALOG_TABLES[kind])
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (maxRows?.[0]?.sort_order ?? 0) + 1;
  const { error } = await sb
    .from(CATALOG_TABLES[kind])
    .insert({ name: parsed.data.name, sort_order: nextOrder });
  if (error) return { ok: false, error: "No se pudo crear el elemento (¿ya existe?)." };
  return { ok: true };
}

export async function updateCatalogItem(kind: CatalogKind, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!kindSchema.safeParse(kind).success) return { ok: false, error: "Catálogo inválido." };
  const parsed = z
    .object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(120).optional(),
      sort_order: z.number().int().optional(),
      is_active: z.boolean().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const sb = getServerSupabase();
  const { id, ...changes } = parsed.data;
  const { error } = await sb.from(CATALOG_TABLES[kind]).update(changes).eq("id", id);
  if (error) return { ok: false, error: "No se pudo actualizar el elemento." };
  return { ok: true };
}

export async function swapCatalogItems(
  kind: CatalogKind,
  idA: string,
  idB: string,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  const sb = getServerSupabase();
  const table = CATALOG_TABLES[kind];
  const { data } = await sb.from(table).select("id, sort_order").in("id", [idA, idB]);
  const rowA = data?.find((r) => r.id === idA);
  const rowB = data?.find((r) => r.id === idB);
  if (!rowA || !rowB) return { ok: false, error: "Elementos no encontrados." };
  await sb.from(table).update({ sort_order: rowB.sort_order }).eq("id", rowA.id);
  await sb.from(table).update({ sort_order: rowA.sort_order }).eq("id", rowB.id);
  return { ok: true };
}

export async function deleteCatalogItem(kind: CatalogKind, id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Vuelve a ingresar." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Elemento inválido." };
  const sb = getServerSupabase();
  const { error } = await sb.from(CATALOG_TABLES[kind]).delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar el elemento." };
  return { ok: true };
}
```

- [ ] **Step 7: Correr tests y verificar que pasan**

```bash
npm test && npx tsc --noEmit
```

Expected: PASS y sin errores de tipos.

- [ ] **Step 8: Commit**

```bash
git add src/lib/records src/lib/catalogs src/app/actions tests/build-row.test.ts && git commit -m "feat(actions): server actions de registros y catálogos con autoría de sesión"
```

---

### Task 10: UI de la matriz — encabezados, tarjetas, celdas estándar y pie de trayectoria

**Files:**
- Create: `src/components/matrix/icon-map.ts`, `src/components/matrix/StageHeader.tsx`, `src/components/matrix/DimensionHeader.tsx`, `src/components/matrix/RecordCard.tsx`, `src/components/matrix/StandardCell.tsx`, `src/components/layout/TrajectoryFooter.tsx`
- Test: `tests/matrix-basic-ui.test.tsx`

- [ ] **Step 1: Escribir tests que fallan**

`tests/matrix-basic-ui.test.tsx`:

```tsx
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
    expect(screen.getByText(/Superior/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL — componentes no existen.

- [ ] **Step 3: Implementar `src/components/matrix/icon-map.ts`**

```ts
import {
  Anchor,
  ArrowLeftRight,
  Briefcase,
  Compass,
  Database,
  Lightbulb,
  Network,
  Search,
  SlidersHorizontal,
  Target,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export const STAGE_ICONS: Record<string, LucideIcon> = {
  Compass,
  Search,
  Target,
  ArrowLeftRight,
  Anchor,
};

export const DIMENSION_ICONS: Record<string, LucideIcon> = {
  Users,
  SlidersHorizontal,
  Briefcase,
  Database,
  TriangleAlert,
  Network,
  Lightbulb,
};

export function getStageIcon(name: string): LucideIcon {
  return STAGE_ICONS[name] ?? Compass;
}

export function getDimensionIcon(name: string): LucideIcon {
  return DIMENSION_ICONS[name] ?? Users;
}
```

- [ ] **Step 4: Implementar `src/components/matrix/StageHeader.tsx`**

```tsx
import { getStage } from "@/constants/matrix-config";
import { getStageIcon } from "./icon-map";

export default function StageHeader({ stageId }: { stageId: number }) {
  const stage = getStage(stageId);
  if (!stage) return null;
  const Icon = getStageIcon(stage.iconName);
  return (
    <div
      className="flex min-h-24 flex-col justify-between gap-1 rounded-lg p-3 text-slate-900"
      style={{ backgroundColor: stage.color }}
      data-testid={`stage-header-${stage.id}`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-700">
        {stage.level}
      </span>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold leading-tight">{stage.name}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-700">{stage.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implementar `src/components/matrix/DimensionHeader.tsx`**

```tsx
import { getDimension } from "@/constants/matrix-config";
import { getDimensionIcon } from "./icon-map";

export default function DimensionHeader({ dimensionId }: { dimensionId: number }) {
  const dimension = getDimension(dimensionId);
  if (!dimension) return null;
  const Icon = getDimensionIcon(dimension.iconName);
  return (
    <div
      className="flex min-h-24 flex-col justify-center gap-1 rounded-lg bg-[#0f2547] p-3 text-white"
      data-testid={`dimension-header-${dimension.id}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0" aria-hidden />
        <p className="text-sm font-semibold leading-tight">{dimension.name}</p>
      </div>
      <p className="text-xs italic leading-snug text-slate-300">{dimension.question}</p>
    </div>
  );
}
```

- [ ] **Step 6: Implementar `src/components/matrix/RecordCard.tsx`**

```tsx
import { getStatus } from "@/constants/matrix-config";
import type { MatrixRecord } from "@/types/matrix";

export default function RecordCard({
  record,
  onOpen,
}: {
  record: MatrixRecord;
  onOpen: (record: MatrixRecord) => void;
}) {
  const status = getStatus(record.status);
  const label = record.action_name ?? record.description;
  return (
    <button
      type="button"
      onClick={() => onOpen(record)}
      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-slate-400"
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: status?.color ?? "#9ca3af" }}
          aria-label={status?.label}
          title={status?.label}
        />
        <p className="line-clamp-3 text-xs leading-snug text-slate-700">{label}</p>
      </div>
    </button>
  );
}
```

- [ ] **Step 7: Implementar `src/components/matrix/StandardCell.tsx`**

```tsx
import { Plus } from "lucide-react";
import type { MatrixRecord } from "@/types/matrix";
import RecordCard from "./RecordCard";

export default function StandardCell({
  dimensionId,
  stageId,
  records,
  onOpen,
  onAdd,
}: {
  dimensionId: number;
  stageId: number;
  records: MatrixRecord[];
  onOpen: (record: MatrixRecord) => void;
  onAdd: (dimensionId: number, stageId: number) => void;
}) {
  return (
    <div className="flex min-h-24 flex-col gap-2 rounded-lg border border-slate-200 bg-white/60 p-2">
      <div className="flex flex-col gap-1.5">
        {records.map((record) => (
          <RecordCard key={record.id} record={record} onOpen={onOpen} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onAdd(dimensionId, stageId)}
        className="mt-auto flex items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-xs text-slate-500 transition hover:border-slate-500 hover:text-slate-700"
      >
        <Plus className="size-3.5" aria-hidden />
        Agregar registro
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Implementar `src/components/layout/TrajectoryFooter.tsx`**

```tsx
export default function TrajectoryFooter() {
  return (
    <div className="flex items-stretch gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs">
      <div className="flex-1 rounded-md bg-[#c8f59b] px-3 py-2 font-medium text-slate-900">
        Media Superior — 1er, 2do y 3er año
      </div>
      <div className="flex-1 rounded-md bg-[#e9d5ff] px-3 py-2 font-medium text-slate-900">
        Transición / Admisión
      </div>
      <div className="flex-1 rounded-md bg-[#bfdbfe] px-3 py-2 font-medium text-slate-900">
        Superior — 1er año
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components tests/matrix-basic-ui.test.tsx && git commit -m "feat(matrix): encabezados, tarjetas, celda estándar y pie de trayectoria"
```

---

### Task 11: UI de la matriz — celda de acciones, filtros, navbar, tablero y página

**Files:**
- Create: `src/components/matrix/ActionsCell.tsx`, `src/components/matrix/FilterBar.tsx`, `src/components/matrix/MatrixBoard.tsx`, `src/components/matrix/MatrixWorkspace.tsx` (versión mínima), `src/components/layout/Navbar.tsx`, `src/components/layout/NavbarShell.tsx`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`
- Test: `tests/matrix-board.test.tsx`

- [ ] **Step 1: Escribir tests que fallan**

`tests/matrix-board.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implementar `src/components/matrix/ActionsCell.tsx`**

```tsx
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { CatalogActionType, MatrixRecord } from "@/types/matrix";
import RecordCard from "./RecordCard";

export default function ActionsCell({
  stageId,
  records,
  actionTypes,
  onOpen,
  onAdd,
}: {
  stageId: number;
  records: MatrixRecord[];
  actionTypes: CatalogActionType[];
  onOpen: (record: MatrixRecord) => void;
  onAdd: (dimensionId: number, stageId: number) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = new Map<string, MatrixRecord[]>();
  for (const record of records) {
    const key = record.action_type_id ?? "sin_tipo";
    const list = groups.get(key) ?? [];
    list.push(record);
    groups.set(key, list);
  }

  return (
    <div className="flex min-h-24 flex-col gap-1.5 rounded-lg border border-slate-200 bg-white/60 p-2">
      {[...groups.entries()].map(([typeId, items]) => {
        const type = actionTypes.find((t) => t.id === typeId);
        const groupName = type?.name ?? "Sin tipo";
        const isCollapsed = collapsed[typeId] ?? false;
        return (
          <div key={typeId} className="rounded-md border border-slate-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center gap-1 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600"
              onClick={() => setCollapsed((c) => ({ ...c, [typeId]: !isCollapsed }))}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? (
                <ChevronRight className="size-3.5" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden />
              )}
              <span className="flex-1">{groupName}</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {items.length}
              </span>
            </button>
            {!isCollapsed ? (
              <div className="flex flex-col gap-1 px-2 pb-2">
                {items.map((record) => (
                  <RecordCard key={record.id} record={record} onOpen={onOpen} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onAdd(3, stageId)}
        className="mt-auto flex items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-xs text-slate-500 transition hover:border-slate-500 hover:text-slate-700"
      >
        <Plus className="size-3.5" aria-hidden />
        Agregar registro
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implementar `src/components/matrix/FilterBar.tsx`**

```tsx
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIMENSIONS, STAGES, STATUSES } from "@/constants/matrix-config";
import type { MatrixRecord, RecordStatus } from "@/types/matrix";

export interface MatrixFilters {
  search: string;
  status: string;
  stage: string;
  dimension: string;
}

export const emptyFilters: MatrixFilters = {
  search: "",
  status: "all",
  stage: "all",
  dimension: "all",
};

export function filterMatrixRecords(records: MatrixRecord[], filters: MatrixFilters): MatrixRecord[] {
  return records.filter((r) => {
    if (filters.status !== "all" && r.status !== (filters.status as RecordStatus)) return false;
    if (filters.stage !== "all") {
      const stage = Number(filters.stage);
      const inStage = r.primary_stage_id === stage || r.related_stage_ids.includes(stage);
      if (!inStage) return false;
    }
    if (filters.dimension !== "all" && r.dimension_id !== Number(filters.dimension)) return false;
    if (filters.search.trim()) {
      const needle = filters.search.trim().toLowerCase();
      const haystack = `${r.description} ${r.action_name ?? ""} ${r.organizer ?? ""} ${r.executor ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: MatrixFilters;
  onChange: (filters: MatrixFilters) => void;
}) {
  return (
    <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">
      <Input
        placeholder="Buscar registro…"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <Select value={filters.status} onValueChange={(v) => onChange({ ...filters, status: v })}>
        <SelectTrigger aria-label="Estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.key} value={s.key}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.stage} onValueChange={(v) => onChange({ ...filters, stage: v })}>
        <SelectTrigger aria-label="Etapa">
          <SelectValue placeholder="Etapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las etapas</SelectItem>
          {STAGES.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.dimension}
        onValueChange={(v) => onChange({ ...filters, dimension: v })}
      >
        <SelectTrigger aria-label="Dimensión">
          <SelectValue placeholder="Dimensión" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las dimensiones</SelectItem>
          {DIMENSIONS.map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 5: Implementar `src/components/layout/Navbar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/types/matrix";
import type { ConnectionStatus } from "@/hooks/useRealtimeMatrix";

const TABS = [
  { href: "/", label: "Matriz" },
  { href: "/analisis", label: "Análisis" },
  { href: "/catalogos", label: "Catálogos" },
];

export default function Navbar({
  user,
  connection,
}: {
  user: SessionUser | null;
  connection: ConnectionStatus;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/acceso");
    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-slate-900">Matriz etapa × dimensión</h1>
        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
            connection === "live"
              ? "bg-emerald-50 text-emerald-700"
              : connection === "connecting"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              connection === "live"
                ? "bg-emerald-500"
                : connection === "connecting"
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
          />
          {connection === "live"
            ? "Sincronización en vivo"
            : connection === "connecting"
              ? "Conectando…"
              : "Sin conexión"}
        </span>
        {user ? (
          <span className="text-slate-600">
            {user.name} · {user.dependency}
          </span>
        ) : null}
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-600 transition hover:bg-slate-100"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Implementar `src/components/layout/NavbarShell.tsx`**

```tsx
"use client";

import type { SessionUser } from "@/types/matrix";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import Navbar from "./Navbar";

export default function NavbarShell({ user }: { user: SessionUser | null }) {
  const { connection } = useMatrix();
  return <Navbar user={user} connection={connection} />;
}
```

- [ ] **Step 7: Implementar `src/components/matrix/MatrixBoard.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import type { MatrixRecord, MatrixSnapshot } from "@/types/matrix";
import { DIMENSIONS, STAGES } from "@/constants/matrix-config";
import StageHeader from "./StageHeader";
import DimensionHeader from "./DimensionHeader";
import StandardCell from "./StandardCell";
import ActionsCell from "./ActionsCell";
import TrajectoryFooter from "@/components/layout/TrajectoryFooter";
import FilterBar, { emptyFilters, filterMatrixRecords, type MatrixFilters } from "./FilterBar";

export interface MatrixBoardProps {
  snapshot: MatrixSnapshot;
  onOpenRecord?: (record: MatrixRecord) => void;
  onAddRecord?: (dimensionId: number, stageId: number) => void;
}

export default function MatrixBoard({ snapshot, onOpenRecord, onAddRecord }: MatrixBoardProps) {
  const [filters, setFilters] = useState<MatrixFilters>(emptyFilters);

  const filtered = useMemo(
    () => filterMatrixRecords(snapshot.records, filters),
    [snapshot.records, filters],
  );

  const handleOpen = onOpenRecord ?? (() => {});
  const handleAdd = onAddRecord ?? (() => {});

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <FilterBar filters={filters} onChange={setFilters} />
        <p className="whitespace-nowrap text-xs font-medium text-slate-500">
          {filtered.length} de {snapshot.records.length} registros
        </p>
      </div>

      <div className="grid grid-cols-[240px_repeat(5,minmax(200px,1fr))] gap-2">
        <div />
        {STAGES.map((stage) => (
          <StageHeader key={stage.id} stageId={stage.id} />
        ))}

        {DIMENSIONS.map((dimension) => (
          <div key={dimension.id} className="col-span-6 grid grid-cols-subgrid gap-2">
            <DimensionHeader dimensionId={dimension.id} />
            {STAGES.map((stage) => {
              const cellRecords = filtered.filter(
                (r) =>
                  r.dimension_id === dimension.id &&
                  (r.primary_stage_id === stage.id || r.related_stage_ids.includes(stage.id)),
              );
              return dimension.extended ? (
                <ActionsCell
                  key={stage.id}
                  stageId={stage.id}
                  records={cellRecords}
                  actionTypes={snapshot.actionTypes}
                  onOpen={handleOpen}
                  onAdd={handleAdd}
                />
              ) : (
                <StandardCell
                  key={stage.id}
                  dimensionId={dimension.id}
                  stageId={stage.id}
                  records={cellRecords}
                  onOpen={handleOpen}
                  onAdd={handleAdd}
                />
              );
            })}
          </div>
        ))}
      </div>

      <TrajectoryFooter />
    </div>
  );
}
```

- [ ] **Step 8: Crear `src/components/matrix/MatrixWorkspace.tsx` (versión mínima por ahora)**

```tsx
"use client";

import { useMatrix } from "@/hooks/useRealtimeMatrix";
import MatrixBoard from "./MatrixBoard";

export default function MatrixWorkspace() {
  const { snapshot } = useMatrix();
  return <MatrixBoard snapshot={snapshot} />;
}
```

(El Task 13 reemplazará este archivo por la versión completa con modal y drawer.)

- [ ] **Step 9: Reescribir `src/app/page.tsx` y actualizar `src/app/layout.tsx`**

`src/app/page.tsx`:

```tsx
import MatrixWorkspace from "@/components/matrix/MatrixWorkspace";

export const dynamic = "force-dynamic";

export default function Page() {
  return <MatrixWorkspace />;
}
```

En `src/app/layout.tsx`, agregar la lectura de sesión y el Navbar dentro del provider (el resto queda igual que en Task 8):

```tsx
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import NavbarShell from "@/components/layout/NavbarShell";

// dentro de RootLayout, después de obtener snapshot:
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const snapshot = await getMatrixSnapshot();
  const jar = await cookies();
  const user = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}>
        <MatrixProvider initial={snapshot}>
          <NavbarShell user={user} />
          {children}
        </MatrixProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 10: Correr tests y verificar que pasan**

```bash
npm test && npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src/components src/app/page.tsx src/app/layout.tsx tests/matrix-board.test.tsx && git commit -m "feat(matrix): tablero 5x7, celda de acciones agrupada, filtros y navbar"
```

---

### Task 12: Formulario de registro (modal) y detalle (drawer)

**Files:**
- Create: `src/components/matrix/RecordFormModal.tsx`, `src/components/matrix/RecordDetailDrawer.tsx`
- Test: `tests/record-form.test.tsx`

- [ ] **Step 1: Escribir tests que fallan**

`tests/record-form.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implementar `src/components/matrix/RecordFormModal.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIONS_DIMENSION_ID,
  DIMENSIONS,
  STAGES,
  STATUSES,
} from "@/constants/matrix-config";
import {
  baseRecordFormSchema,
  getRecordFormSchema,
  type CatalogActionType,
  type CatalogDependency,
  type CatalogModality,
  type MatrixRecord,
  type RecordFormValues,
} from "@/types/matrix";
import { createRecord, updateRecord } from "@/app/actions/records";

interface Props {
  open: boolean;
  onClose: () => void;
  dimensionId: number;
  stageId: number;
  record?: MatrixRecord;
  actionTypes: CatalogActionType[];
  modalities: CatalogModality[];
  dependencies: CatalogDependency[];
}

export default function RecordFormModal({
  open,
  onClose,
  dimensionId,
  stageId,
  record,
  actionTypes,
  modalities,
  dependencies,
}: Props) {
  const isAction = dimensionId === ACTIONS_DIMENSION_ID;
  const schema = useMemo(() => getRecordFormSchema(dimensionId), [dimensionId]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(schema as typeof baseRecordFormSchema),
    defaultValues: {
      dimensionId,
      primaryStageId: record?.primary_stage_id ?? stageId,
      relatedStageIds: record?.related_stage_ids ?? [],
      description: record?.description ?? "",
      status: record?.status ?? "sin_clasificar",
      dependencyIds: record?.dependency_ids ?? [],
      ...(isAction && record
        ? {
            actionName: record.action_name ?? "",
            actionTypeId: record.action_type_id ?? "",
            organizer: record.organizer ?? "",
            executor: record.executor ?? "",
            modalityId: record.modality_id ?? "",
          }
        : {}),
    } as RecordFormValues,
  });

  const relatedStageIds = watch("relatedStageIds") ?? [];
  const dependencyIds = watch("dependencyIds") ?? [];
  const status = watch("status");

  function toggleValue(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
  }

  function toggleDependency(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
  }

  async function onSubmit(values: RecordFormValues) {
    const res = record ? await updateRecord(record.id, values) : await createRecord(values);
    if (res.ok) {
      reset();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {record ? "Editar registro" : "Nuevo registro"} —{" "}
            {DIMENSIONS.find((d) => d.id === dimensionId)?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("dimensionId")} />

          {isAction ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="actionName">Nombre de la acción o recurso</Label>
                <Input id="actionName" {...register("actionName")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo de acción o recurso</Label>
                  <Select
                    value={watch("actionTypeId") ?? ""}
                    onValueChange={(v) => setValue("actionTypeId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes
                        .filter((t) => t.is_active)
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modalidad</Label>
                  <Select
                    value={watch("modalityId") ?? ""}
                    onValueChange={(v) => setValue("modalityId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {modalities
                        .filter((m) => m.is_active)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizer">Quién lo organiza</Label>
                  <Input id="organizer" {...register("organizer")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="executor">Quién lo aplica o ejecuta</Label>
                  <Input id="executor" {...register("executor")} />
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={3} {...register("description")} />
            {errors.description ? (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Etapa principal</Label>
            <Select
              value={String(watch("primaryStageId"))}
              onValueChange={(v) => setValue("primaryStageId", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Etapas relacionadas</Label>
            <div className="flex flex-wrap gap-3">
              {STAGES.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Checkbox
                    checked={relatedStageIds.includes(s.id)}
                    onCheckedChange={() =>
                      setValue("relatedStageIds", toggleValue(relatedStageIds, s.id))
                    }
                  />
                  Etapa {s.id}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado del registro</Label>
            <Select
              value={status}
              onValueChange={(v) => setValue("status", v as RecordFormValues["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dependencias participantes</Label>
            <div className="flex flex-wrap gap-3">
              {dependencies
                .filter((d) => d.is_active)
                .map((d) => (
                  <label key={d.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Checkbox
                      checked={dependencyIds.includes(d.id)}
                      onCheckedChange={() =>
                        setValue("dependencyIds", toggleDependency(dependencyIds, d.id))
                      }
                    />
                    {d.name}
                  </label>
                ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Implementar `src/components/matrix/RecordDetailDrawer.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getStatus, getDimension, getStage } from "@/constants/matrix-config";
import type { MatrixRecord } from "@/types/matrix";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function RecordDetailDrawer({
  record,
  typeName,
  modalityName,
  dependencyNames,
  onClose,
  onEdit,
  onDelete,
}: {
  record: MatrixRecord;
  typeName?: string;
  modalityName?: string;
  dependencyNames: string[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const status = getStatus(record.status);
  const dimension = getDimension(record.dimension_id);
  const stage = getStage(record.primary_stage_id);

  return (
    <Sheet open onOpenChange={(o) => (!o ? onClose() : null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-left">
            {record.action_name ?? dimension?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: status?.color }} />
            <span className="font-medium">{status?.label}</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">Dimensión</p>
            <p>{dimension?.name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">Etapa principal</p>
            <p>{stage?.name}</p>
            {record.related_stage_ids.length > 0 ? (
              <p className="text-xs text-slate-500">
                Etapas relacionadas: {record.related_stage_ids.join(", ")}
              </p>
            ) : null}
          </div>

          {record.dimension_id === 3 ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Tipo</p>
                <p>{typeName ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Modalidad</p>
                <p>{modalityName ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Organiza</p>
                <p>{record.organizer ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-slate-400">Ejecuta</p>
                <p>{record.executor ?? "—"}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">Descripción</p>
            <p className="text-slate-700">{record.description}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Dependencias participantes
            </p>
            {dependencyNames.length > 0 ? (
              <p>{dependencyNames.join(", ")}</p>
            ) : (
              <p className="text-slate-400">Sin dependencias</p>
            )}
          </div>

          <div className="space-y-1 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
            <p>
              Creado por: {record.created_by_name} ({record.created_by_dependency}) el{" "}
              {formatDate(record.created_at)}
            </p>
            <p>
              Última edición: {record.updated_by_name} ({record.updated_by_dependency}) el{" "}
              {formatDate(record.updated_at)}
            </p>
          </div>

          {onEdit || onDelete ? (
            <div className="flex gap-2">
              {onEdit ? (
                <Button className="flex-1" onClick={onEdit}>
                  Editar
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("¿Eliminar este registro?")) onDelete();
                  }}
                >
                  Eliminar
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/matrix tests/record-form.test.tsx && git commit -m "feat(matrix): modal de registro con campos condicionales y drawer de detalle"
```

---

### Task 13: Workspace de la matriz (board + modal + drawer integrados)

**Files:**
- Modify: `src/components/matrix/MatrixWorkspace.tsx` (reemplazar versión mínima)
- Test: `tests/matrix-workspace.test.tsx`

- [ ] **Step 1: Escribir test que falla**

`tests/matrix-workspace.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Correr test y verificar que falla**

```bash
npm test
```

Expected: FAIL — la versión mínima no abre modal.

- [ ] **Step 3: Reemplazar `src/components/matrix/MatrixWorkspace.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import type { MatrixRecord } from "@/types/matrix";
import MatrixBoard from "./MatrixBoard";
import RecordFormModal from "./RecordFormModal";
import RecordDetailDrawer from "./RecordDetailDrawer";
import { deleteRecord } from "@/app/actions/records";

type ModalState =
  | { mode: "closed" }
  | { mode: "create"; dimensionId: number; stageId: number }
  | { mode: "edit"; record: MatrixRecord };

export default function MatrixWorkspace() {
  const { snapshot } = useMatrix();
  const [modalState, setModalState] = useState<ModalState>({ mode: "closed" });
  const [detailRecord, setDetailRecord] = useState<MatrixRecord | null>(null);

  return (
    <main>
      <MatrixBoard
        snapshot={snapshot}
        onOpenRecord={setDetailRecord}
        onAddRecord={(dimensionId, stageId) =>
          setModalState({ mode: "create", dimensionId, stageId })
        }
      />

      {modalState.mode === "create" ? (
        <RecordFormModal
          open
          onClose={() => setModalState({ mode: "closed" })}
          dimensionId={modalState.dimensionId}
          stageId={modalState.stageId}
          actionTypes={snapshot.actionTypes}
          modalities={snapshot.modalities}
          dependencies={snapshot.dependencies}
        />
      ) : null}

      {modalState.mode === "edit" ? (
        <RecordFormModal
          open
          onClose={() => setModalState({ mode: "closed" })}
          dimensionId={modalState.record.dimension_id}
          stageId={modalState.record.primary_stage_id}
          record={modalState.record}
          actionTypes={snapshot.actionTypes}
          modalities={snapshot.modalities}
          dependencies={snapshot.dependencies}
        />
      ) : null}

      {detailRecord ? (
        <RecordDetailDrawer
          record={snapshot.records.find((r) => r.id === detailRecord.id) ?? detailRecord}
          typeName={snapshot.actionTypes.find((t) => t.id === detailRecord.action_type_id)?.name}
          modalityName={snapshot.modalities.find((m) => m.id === detailRecord.modality_id)?.name}
          dependencyNames={snapshot.dependencies
            .filter((d) => detailRecord.dependency_ids.includes(d.id))
            .map((d) => d.name)}
          onClose={() => setDetailRecord(null)}
          onEdit={() => {
            setModalState({ mode: "edit", record: detailRecord });
            setDetailRecord(null);
          }}
          onDelete={() => {
            if (window.confirm("¿Eliminar este registro?")) {
              void deleteRecord(detailRecord.id);
              setDetailRecord(null);
            }
          }}
        />
      ) : null}
    </main>
  );
}
```

- [ ] **Step 4: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/matrix tests/matrix-workspace.test.tsx && git commit -m "feat(matrix): workspace con board, modal y drawer integrados"
```

---

### Task 14: Constructor del grafo de nodos (puro, TDD)

**Files:**
- Create: `src/lib/analysis/graph-builder.ts`
- Test: `tests/graph-builder.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

`tests/graph-builder.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildGraph, filterRecords } from "@/lib/analysis/graph-builder";
import type { MatrixRecord } from "@/types/matrix";

const r = (id: string, over: Partial<MatrixRecord>): MatrixRecord => ({
  id,
  dimension_id: 1,
  primary_stage_id: 1,
  related_stage_ids: [],
  description: `Registro ${id}`,
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
  ...over,
});

const records = [
  r("a", { primary_stage_id: 1, related_stage_ids: [2], dependency_ids: ["SEMS-ID"] }),
  r("b", { primary_stage_id: 2, dependency_ids: ["SEMS-ID", "CGAI-ID"] }),
  r("c", { primary_stage_id: 5, dependency_ids: [] }),
];

describe("filterRecords", () => {
  it("filtra por etapa (principal o relacionada)", () => {
    expect(filterRecords(records, { stageIds: [2] }).map((x) => x.id)).toEqual(["a", "b"]);
  });
  it("filtra por estado", () => {
    expect(filterRecords(records, { statusKeys: ["sin_clasificar"] })).toHaveLength(3);
    expect(filterRecords(records, { statusKeys: ["existe_y_funciona"] })).toHaveLength(0);
  });
  it("filtra por texto", () => {
    expect(filterRecords(records, { search: "registro b" }).map((x) => x.id)).toEqual(["b"]);
  });
  it("filtra por dependencia", () => {
    expect(filterRecords(records, { dependencyIds: ["CGAI-ID"] }).map((x) => x.id)).toEqual(["b"]);
  });
});

describe("buildGraph", () => {
  it("modo stages: nodos de registro + hubs de etapa con aristas", () => {
    const { nodes, edges } = buildGraph(records, "stages");
    expect(nodes.filter((n) => n.kind === "record")).toHaveLength(3);
    expect(nodes.filter((n) => n.kind === "stage").map((n) => n.id).sort()).toEqual([
      "s:1",
      "s:2",
      "s:5",
    ]);
    expect(edges.filter((e) => e.kind === "stage")).toHaveLength(4);
  });

  it("modo dependencies: hubs de dependencia y aristas registro→dependencia", () => {
    const { nodes, edges } = buildGraph(records, "dependencies");
    expect(nodes.filter((n) => n.kind === "dependency").map((n) => n.id).sort()).toEqual([
      "d:CGAI-ID",
      "d:SEMS-ID",
    ]);
    expect(edges.filter((e) => e.kind === "dependency")).toHaveLength(3);
  });

  it("modo full: contiene hubs de etapas y dependencias", () => {
    const { nodes } = buildGraph(records, "full");
    expect(nodes.some((n) => n.kind === "stage")).toBe(true);
    expect(nodes.some((n) => n.kind === "dependency")).toBe(true);
  });

  it("los nodos de registro llevan color de estado", () => {
    const { nodes } = buildGraph([r("x", { status: "existe_y_funciona" })], "stages");
    const recordNode = nodes.find((n) => n.kind === "record");
    expect(recordNode?.statusColor).toBe("#10b981");
  });

  it("no crea hubs de dependencia sin vínculos", () => {
    const { nodes } = buildGraph([r("c")], "dependencies");
    expect(nodes.filter((n) => n.kind === "dependency")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL — no existe `@/lib/analysis/graph-builder`.

- [ ] **Step 3: Implementar `src/lib/analysis/graph-builder.ts`**

```ts
import { getStage, getStatus } from "@/constants/matrix-config";
import type { MatrixRecord, RecordStatus } from "@/types/matrix";

export type GraphMode = "stages" | "dependencies" | "full";

export interface GraphFilters {
  stageIds?: number[];
  dimensionIds?: number[];
  statusKeys?: RecordStatus[];
  dependencyIds?: string[];
  search?: string;
}

export interface GraphNode {
  id: string;
  kind: "record" | "stage" | "dependency";
  label: string;
  recordId?: string;
  statusKey?: RecordStatus;
  statusColor?: string;
  stageId?: number;
  dimensionId?: number;
  color?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: "stage" | "dependency";
}

export function filterRecords(records: MatrixRecord[], filters: GraphFilters): MatrixRecord[] {
  return records.filter((r) => {
    if (filters.stageIds && filters.stageIds.length > 0) {
      const involved = [r.primary_stage_id, ...r.related_stage_ids];
      if (!filters.stageIds.some((s) => involved.includes(s))) return false;
    }
    if (filters.dimensionIds && filters.dimensionIds.length > 0) {
      if (!filters.dimensionIds.includes(r.dimension_id)) return false;
    }
    if (filters.statusKeys && filters.statusKeys.length > 0) {
      if (!filters.statusKeys.includes(r.status)) return false;
    }
    if (filters.dependencyIds && filters.dependencyIds.length > 0) {
      if (!filters.dependencyIds.some((d) => r.dependency_ids.includes(d))) return false;
    }
    if (filters.search && filters.search.trim()) {
      const needle = filters.search.trim().toLowerCase();
      const haystack = `${r.description} ${r.action_name ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function buildGraph(
  records: MatrixRecord[],
  mode: GraphMode,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const stageHubIds = new Set<number>();
  const dependencyHubIds = new Set<string>();

  for (const record of records) {
    nodes.push({
      id: `r:${record.id}`,
      kind: "record",
      label: record.action_name ?? record.description,
      recordId: record.id,
      statusKey: record.status,
      statusColor: getStatus(record.status)?.color,
      stageId: record.primary_stage_id,
      dimensionId: record.dimension_id,
    });

    if (mode === "stages" || mode === "full") {
      const stages = [record.primary_stage_id, ...record.related_stage_ids];
      for (const stageId of stages) {
        stageHubIds.add(stageId);
        edges.push({
          id: `e:r:${record.id}-s:${stageId}`,
          source: `r:${record.id}`,
          target: `s:${stageId}`,
          kind: "stage",
        });
      }
    }

    if (mode === "dependencies" || mode === "full") {
      for (const dependencyId of record.dependency_ids) {
        dependencyHubIds.add(dependencyId);
        edges.push({
          id: `e:r:${record.id}-d:${dependencyId}`,
          source: `r:${record.id}`,
          target: `d:${dependencyId}`,
          kind: "dependency",
        });
      }
    }
  }

  for (const stageId of stageHubIds) {
    const stage = getStage(stageId);
    nodes.push({
      id: `s:${stageId}`,
      kind: "stage",
      label: stage?.name ?? `Etapa ${stageId}`,
      stageId,
      color: stage?.color,
    });
  }

  for (const dependencyId of dependencyHubIds) {
    nodes.push({
      id: `d:${dependencyId}`,
      kind: "dependency",
      label: dependencyId,
    });
  }

  return { nodes, edges };
}
```

Nota de diseño: los hubs de dependencia usan el `id` como `label` aquí; el componente del Task 16 recibe `dependencies: CatalogDependency[]` y resuelve el nombre real vía un mapa `id → name` (los ids de dependencia en nodos son `d:<id>`).

- [ ] **Step 4: Correr tests y verificar que pasan**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysis tests/graph-builder.test.ts && git commit -m "feat(analysis): constructor puro del grafo con modos stages/dependencies/full"
```

---

### Task 15: Agregaciones estadísticas y dashboard de gráficas

**Files:**
- Create: `src/lib/analysis/aggregate.ts`, `src/components/analysis/ChartsDashboard.tsx`
- Test: `tests/aggregate.test.ts`

- [ ] **Step 1: Escribir tests que fallan**

`tests/aggregate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  kpis,
  countByStatus,
  stageStatusSeries,
  heatCells,
  countByDependency,
  actionsByCatalog,
} from "@/lib/analysis/aggregate";
import type { CatalogDependency, MatrixRecord } from "@/types/matrix";

const r = (id: string, over: Partial<MatrixRecord>): MatrixRecord => ({
  id,
  dimension_id: 1,
  primary_stage_id: 1,
  related_stage_ids: [],
  description: `Registro ${id}`,
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
  ...over,
});

const records = [
  r("a", { status: "existe_y_funciona", primary_stage_id: 1 }),
  r("b", { status: "existe_y_funciona", primary_stage_id: 1 }),
  r("c", { status: "requiere_fortalecimiento", primary_stage_id: 2, dimension_id: 5 }),
  r("d", {
    dimension_id: 3,
    primary_stage_id: 2,
    action_type_id: "t1",
    modality_id: "m1",
    dependency_ids: ["dep1"],
  }),
];

const dependencies: CatalogDependency[] = [
  { id: "dep1", name: "SEMS", code: "SEMS", sort_order: 1, is_active: true },
  { id: "dep2", name: "CGAI", code: "CGAI", sort_order: 2, is_active: true },
];

describe("kpis", () => {
  it("calcula totales y porcentajes", () => {
    const k = kpis(records);
    expect(k.total).toBe(4);
    expect(k.workingPct).toBe(50);
    expect(k.strengtheningPct).toBe(25);
    expect(k.gaps).toBe(1);
  });
});

describe("countByStatus", () => {
  it("cuenta por estado incluyendo ceros", () => {
    const counts = countByStatus(records);
    expect(counts.find((c) => c.key === "existe_y_funciona")?.count).toBe(2);
    expect(counts.find((c) => c.key === "sin_clasificar")?.count).toBe(1);
    expect(counts.find((c) => c.key === "no_existe")?.count).toBe(0);
  });
});

describe("stageStatusSeries", () => {
  it("produce una serie por etapa", () => {
    const series = stageStatusSeries(records);
    expect(series).toHaveLength(5);
    const stage1 = series.find((s) => s.stageId === 1);
    expect(stage1?.["Existe y Funciona"]).toBe(2);
    const stage2 = series.find((s) => s.stageId === 2);
    expect(stage2?.["Requiere fortalecimiento o actualización"]).toBe(1);
  });
});

describe("heatCells", () => {
  it("produce celdas etapa × dimensión con conteo", () => {
    const cells = heatCells(records);
    const cell = cells.find((c) => c.stageId === 1 && c.dimensionId === 1);
    expect(cell?.count).toBe(2);
    const missing = cells.find((c) => c.stageId === 5 && c.dimensionId === 7);
    expect(missing?.count ?? 0).toBe(0);
  });
});

describe("countByDependency", () => {
  it("cuenta registros por dependencia", () => {
    const counts = countByDependency(records, dependencies);
    expect(counts.find((c) => c.name === "SEMS")?.count).toBe(1);
    expect(counts.find((c) => c.name === "CGAI")?.count).toBe(0);
  });
});

describe("actionsByCatalog", () => {
  it("agrupa acciones por tipo y por modalidad", () => {
    const types = actionsByCatalog(records, "action_type_id", [
      { id: "t1", name: "Test vocacionales", sort_order: 1, is_active: true },
    ]);
    expect(types.find((t) => t.name === "Test vocacionales")?.count).toBe(1);
    const mods = actionsByCatalog(records, "modality_id", [
      { id: "m1", name: "Presencial", sort_order: 1, is_active: true },
    ]);
    expect(mods.find((m) => m.name === "Presencial")?.count).toBe(1);
  });
});
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL — no existe `@/lib/analysis/aggregate`.

- [ ] **Step 3: Implementar `src/lib/analysis/aggregate.ts`**

```ts
import { DIMENSIONS, STAGES, STATUSES } from "@/constants/matrix-config";
import type {
  CatalogDependency,
  MatrixRecord,
  RecordStatus,
} from "@/types/matrix";

export interface Kpis {
  total: number;
  workingPct: number;
  strengtheningPct: number;
  gaps: number;
}

export function kpis(records: MatrixRecord[]): Kpis {
  const total = records.length;
  const working = records.filter((r) => r.status === "existe_y_funciona").length;
  const strengthening = records.filter((r) => r.status === "requiere_fortalecimiento").length;
  const gaps = records.filter((r) => r.dimension_id === 5).length;
  return {
    total,
    workingPct: total === 0 ? 0 : Math.round((working / total) * 100),
    strengtheningPct: total === 0 ? 0 : Math.round((strengthening / total) * 100),
    gaps,
  };
}

export function countByStatus(records: MatrixRecord[]): {
  key: RecordStatus;
  label: string;
  color: string;
  count: number;
}[] {
  return STATUSES.map((status) => ({
    key: status.key,
    label: status.label,
    color: status.color,
    count: records.filter((r) => r.status === status.key).length,
  }));
}

export interface StageStatusRow {
  stageId: number;
  stage: string;
  [statusLabel: string]: number | string;
}

export function stageStatusSeries(records: MatrixRecord[]): StageStatusRow[] {
  return STAGES.map((stage) => {
    const row: StageStatusRow = { stageId: stage.id, stage: stage.name };
    for (const status of STATUSES) {
      row[status.label] = records.filter(
        (r) => r.primary_stage_id === stage.id && r.status === status.key,
      ).length;
    }
    return row;
  });
}

export function heatCells(records: MatrixRecord[]): {
  stageId: number;
  dimensionId: number;
  count: number;
}[] {
  const cells: { stageId: number; dimensionId: number; count: number }[] = [];
  for (const stage of STAGES) {
    for (const dimension of DIMENSIONS) {
      const count = records.filter(
        (r) =>
          r.dimension_id === dimension.id &&
          (r.primary_stage_id === stage.id || r.related_stage_ids.includes(stage.id)),
      ).length;
      cells.push({ stageId: stage.id, dimensionId: dimension.id, count });
    }
  }
  return cells;
}

export function countByDependency(
  records: MatrixRecord[],
  dependencies: CatalogDependency[],
): { name: string; count: number }[] {
  return dependencies.map((dependency) => ({
    name: dependency.name,
    count: records.filter((r) => r.dependency_ids.includes(dependency.id)).length,
  }));
}

export function actionsByCatalog(
  records: MatrixRecord[],
  field: "action_type_id" | "modality_id",
  catalog: { id: string; name: string }[],
): { name: string; count: number }[] {
  const actions = records.filter((r) => r.dimension_id === 3);
  return catalog.map((item) => ({
    name: item.name,
    count: actions.filter((r) => r[field] === item.id).length,
  }));
}
```

- [ ] **Step 4: Implementar `src/components/analysis/ChartsDashboard.tsx`**

```tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DIMENSIONS, STAGES, STATUSES } from "@/constants/matrix-config";
import type { CatalogDependency, MatrixSnapshot } from "@/types/matrix";
import {
  actionsByCatalog,
  countByDependency,
  countByStatus,
  heatCells,
  kpis,
  stageStatusSeries,
} from "@/lib/analysis/aggregate";

export default function ChartsDashboard({ snapshot }: { snapshot: MatrixSnapshot }) {
  const { records, dependencies, actionTypes, modalities } = snapshot;
  const statusData = countByStatus(records);
  const stageData = stageStatusSeries(records);
  const heat = heatCells(records);
  const depData = countByDependency(records, dependencies);
  const typeData = actionsByCatalog(records, "action_type_id", actionTypes);
  const modalityData = actionsByCatalog(records, "modality_id", modalities);
  const k = kpis(records);
  const maxHeat = Math.max(1, ...heat.map((c) => c.count));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Total de registros</p>
          <p className="text-2xl font-semibold">{k.total}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Existe y funciona</p>
          <p className="text-2xl font-semibold text-emerald-600">{k.workingPct}%</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Requiere fortalecimiento</p>
          <p className="text-2xl font-semibold text-blue-600">{k.strengtheningPct}%</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">Vacíos o barreras</p>
          <p className="text-2xl font-semibold text-red-600">{k.gaps}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">Distribución por estado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {statusData.map((s) => (
                    <Cell key={s.key} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">Registros por etapa y estado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {STATUSES.map((s) => (
                  <Bar key={s.key} dataKey={s.label} stackId="a" fill={s.color} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Mapa de calor Etapa × Dimensión</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left text-slate-500">Dimensión</th>
                  {STAGES.map((s) => (
                    <th key={s.id} className="p-1 text-slate-600">
                      {s.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map((d) => (
                  <tr key={d.id}>
                    <td className="p-1 pr-2 text-slate-600">{d.name}</td>
                    {STAGES.map((s) => {
                      const cell = heat.find(
                        (c) => c.stageId === s.id && c.dimensionId === d.id,
                      );
                      const intensity = (cell?.count ?? 0) / maxHeat;
                      return (
                        <td key={s.id} className="p-0.5">
                          <div
                            className="flex h-8 items-center justify-center rounded font-medium text-slate-800"
                            style={{ backgroundColor: `rgba(59, 130, 246, ${intensity * 0.7})` }}
                            title={`${d.name} × ${s.name}: ${cell?.count ?? 0}`}
                          >
                            {cell?.count ?? 0}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">Participación por dependencia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f2547" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold">
            Acciones por tipo y modalidad (Dimensión 3)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modalityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Correr tests y verificar que pasan**

```bash
npm test && npx tsc --noEmit
```

Expected: PASS (los tests son de las funciones puras; el dashboard se valida visualmente en el Task 18).

- [ ] **Step 6: Commit**

```bash
git add src/lib/analysis src/components/analysis tests/aggregate.test.ts && git commit -m "feat(analysis): agregaciones estadísticas y dashboard de gráficas"
```

---

### Task 16: Grafo interactivo de nodos y página `/analisis`

**Files:**
- Create: `src/components/analysis/EcosystemNodeGraph.tsx`, `src/components/analysis/GraphControls.tsx`, `src/components/analysis/AnalysisWorkspace.tsx`, `src/app/analisis/page.tsx`
- Test: `tests/graph-ui.test.tsx`

- [ ] **Step 1: Escribir tests que fallan**

`tests/graph-ui.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Correr tests y verificar que fallan**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implementar `src/components/analysis/GraphControls.tsx`**

```tsx
"use client";

import { Input } from "@/components/ui/input";
import type { GraphMode } from "@/lib/analysis/graph-builder";

const MODES: { key: GraphMode; label: string }[] = [
  { key: "stages", label: "Por etapas" },
  { key: "dependencies", label: "Por dependencias" },
  { key: "full", label: "Ecosistema completo" },
];

export default function GraphControls({
  mode,
  onModeChange,
  search,
  onSearchChange,
}: {
  mode: GraphMode;
  onModeChange: (mode: GraphMode) => void;
  search: string;
  onSearchChange: (search: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-lg border bg-white p-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onModeChange(m.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === m.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Input
        placeholder="Buscar registro en el grafo…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
    </div>
  );
}
```

- [ ] **Step 4: Implementar `src/components/analysis/EcosystemNodeGraph.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import "@xyflow/react/dist/style.css";
import type { CatalogDependency, MatrixRecord, MatrixSnapshot } from "@/types/matrix";
import {
  buildGraph,
  filterRecords,
  type GraphEdge,
  type GraphFilters,
  type GraphMode,
  type GraphNode,
} from "@/lib/analysis/graph-builder";

type SimNode = GraphNode & { x?: number; y?: number };

function layout(nodes: GraphNode[], edges: GraphEdge[]): Node[] {
  const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
  const links = edges.map((e) => ({ source: e.source, target: e.target }));
  const simulation = forceSimulation(simNodes as never)
    .force(
      "link",
      forceLink(links)
        .id((d: { id: string }) => d.id)
        .distance(140)
        .strength(0.2),
    )
    .force("charge", forceManyBody().strength(-500))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(90))
    .stop();
  simulation.tick(150);

  return simNodes.map((n) => ({
    id: n.id,
    type: n.kind === "record" ? "recordNode" : "hubNode",
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    data: n,
  }));
}

function RecordNodeView({ data }: NodeProps) {
  const node = data as GraphNode;
  return (
    <div
      className="w-40 rounded-md border-2 bg-white px-2 py-1.5 shadow-sm"
      style={{ borderColor: node.statusColor ?? "#9ca3af" }}
    >
      <p className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-700">
        {node.label}
      </p>
      <p className="mt-1 text-[9px] text-slate-400">Dimensión {node.dimensionId}</p>
    </div>
  );
}

function HubNodeView({ data }: NodeProps) {
  const node = data as GraphNode;
  return (
    <div
      className="rounded-full border px-3 py-1.5 text-[10px] font-semibold text-slate-800 shadow-sm"
      style={{ backgroundColor: node.color ?? "#e2e8f0", borderColor: "#94a3b8" }}
    >
      {node.label}
    </div>
  );
}

const nodeTypes = { recordNode: RecordNodeView, hubNode: HubNodeView };

export default function EcosystemNodeGraph({
  records,
  dependencies,
  mode,
  filters,
  onSelectRecord,
}: {
  records: MatrixRecord[];
  dependencies: CatalogDependency[];
  mode: GraphMode;
  filters: GraphFilters;
  onSelectRecord: (record: MatrixRecord) => void;
}) {
  const filtered = useMemo(() => filterRecords(records, filters), [records, filters]);

  const { nodes, edges, nameById } = useMemo(() => {
    const graph = buildGraph(filtered, mode);
    const dependencyNames = new Map<string, string>();
    for (const dep of dependencies) dependencyNames.set(`d:${dep.id}`, dep.name);
    const resolved = graph.nodes.map((n) =>
      n.kind === "dependency" ? { ...n, label: dependencyNames.get(n.id) ?? n.label } : n,
    );
    return {
      nodes: layout(resolved, graph.edges),
      edges: graph.edges.map((e) => ({ ...e, animated: true })) as Edge[],
      nameById: new Map(resolved.map((n) => [n.id, n])),
    };
  }, [filtered, mode, dependencies]);

  return (
    <div className="h-[520px] rounded-lg border bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        onNodeClick={(_, node) => {
          const graphNode = nameById.get(node.id);
          if (graphNode?.kind === "record" && graphNode.recordId) {
            const record = records.find((r) => r.id === graphNode.recordId);
            if (record) onSelectRecord(record);
          }
        }}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 5: Implementar `src/components/analysis/AnalysisWorkspace.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import type { MatrixRecord } from "@/types/matrix";
import type { GraphFilters, GraphMode } from "@/lib/analysis/graph-builder";
import EcosystemNodeGraph from "./EcosystemNodeGraph";
import GraphControls from "./GraphControls";
import ChartsDashboard from "./ChartsDashboard";
import RecordDetailDrawer from "@/components/matrix/RecordDetailDrawer";

export default function AnalysisWorkspace() {
  const { snapshot } = useMatrix();
  const [mode, setMode] = useState<GraphMode>("stages");
  const [search, setSearch] = useState("");
  const [detailRecord, setDetailRecord] = useState<MatrixRecord | null>(null);

  const filters: GraphFilters = { search };

  return (
    <main className="space-y-4 p-4">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Gráfica de nodos del ecosistema
        </h2>
        <GraphControls mode={mode} onModeChange={setMode} search={search} onSearchChange={setSearch} />
        <EcosystemNodeGraph
          records={snapshot.records}
          dependencies={snapshot.dependencies}
          mode={mode}
          filters={filters}
          onSelectRecord={setDetailRecord}
        />
        <p className="text-xs text-slate-500">
          Haz clic en un nodo de registro para abrir su ficha. Los nodos se conectan
          automáticamente según etapas y dependencias compartidas.
        </p>
      </div>

      <ChartsDashboard snapshot={snapshot} />

      {detailRecord ? (
        <RecordDetailDrawer
          record={detailRecord}
          typeName={snapshot.actionTypes.find((t) => t.id === detailRecord.action_type_id)?.name}
          modalityName={snapshot.modalities.find((m) => m.id === detailRecord.modality_id)?.name}
          dependencyNames={snapshot.dependencies
            .filter((d) => detailRecord.dependency_ids.includes(d.id))
            .map((d) => d.name)}
          onClose={() => setDetailRecord(null)}
        />
      ) : null}
    </main>
  );
}
```

- [ ] **Step 6: Implementar `src/app/analisis/page.tsx`**

```tsx
import AnalysisWorkspace from "@/components/analysis/AnalysisWorkspace";

export const dynamic = "force-dynamic";

export default function Page() {
  return <AnalysisWorkspace />;
}
```

- [ ] **Step 7: Correr tests y verificar que pasan**

```bash
npm test && npx tsc --noEmit
```

Expected: PASS. Si ReactFlow emite advertencias de tamaño cero en jsdom, son esperadas (el contenedor tiene tamaño real en el navegador).

- [ ] **Step 8: Commit**

```bash
git add src/components/analysis src/app/analisis tests/graph-ui.test.tsx && git commit -m "feat(analysis): grafo interactivo de nodos con layout de fuerzas y página /analisis"
```

---

### Task 17: Administración de catálogos y página `/catalogos`

**Files:**
- Create: `src/components/catalogs/CatalogManager.tsx`, `src/app/catalogos/page.tsx`
- Test: `tests/catalogs-page.test.tsx`

- [ ] **Step 1: Escribir test que falla**

`tests/catalogs-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
```

- [ ] **Step 2: Correr test y verificar que falla**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 3: Implementar `src/components/catalogs/CatalogManager.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useMatrix } from "@/hooks/useRealtimeMatrix";
import {
  createCatalogItem,
  deleteCatalogItem,
  swapCatalogItems,
  updateCatalogItem,
} from "@/app/actions/catalogs";
import type { CatalogKind } from "@/types/matrix";

interface PanelConfig {
  kind: CatalogKind;
  title: string;
  items: { id: string; name: string; is_active: boolean; sort_order: number }[];
}

export default function CatalogManager() {
  const { snapshot } = useMatrix();
  const [newNames, setNewNames] = useState<Record<string, string>>({});

  const panels: PanelConfig[] = [
    { kind: "action_types", title: "Tipos de acción o recurso", items: snapshot.actionTypes },
    { kind: "modalities", title: "Modalidades", items: snapshot.modalities },
    { kind: "dependencies", title: "Dependencias participantes", items: snapshot.dependencies },
  ];

  async function handleAdd(kind: CatalogKind) {
    const name = newNames[kind]?.trim();
    if (!name) return;
    await createCatalogItem(kind, { name });
    setNewNames((s) => ({ ...s, [kind]: "" }));
  }

  return (
    <main className="grid gap-4 p-4 lg:grid-cols-3">
      {panels.map((panel) => (
        <section key={panel.kind} className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{panel.title}</h2>

          <ul className="mb-3 space-y-1.5">
            {panel.items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              >
                <span className={`flex-1 ${item.is_active ? "" : "text-slate-400 line-through"}`}>
                  {item.name}
                </span>
                <button
                  type="button"
                  aria-label={`Subir ${item.name}`}
                  disabled={index === 0}
                  className="text-slate-400 transition hover:text-slate-700 disabled:opacity-30"
                  onClick={() =>
                    void swapCatalogItems(panel.kind, item.id, panel.items[index - 1].id)
                  }
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Bajar ${item.name}`}
                  disabled={index === panel.items.length - 1}
                  className="text-slate-400 transition hover:text-slate-700 disabled:opacity-30"
                  onClick={() =>
                    void swapCatalogItems(panel.kind, item.id, panel.items[index + 1].id)
                  }
                >
                  <ArrowDown className="size-3.5" />
                </button>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={(checked) =>
                    void updateCatalogItem(panel.kind, {
                      id: item.id,
                      is_active: checked,
                    })
                  }
                  aria-label={`Activar ${item.name}`}
                />
                <button
                  type="button"
                  aria-label={`Eliminar ${item.name}`}
                  className="text-slate-400 transition hover:text-red-600"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${item.name}" del catálogo?`)) {
                      void deleteCatalogItem(panel.kind, item.id);
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Input
              placeholder="Nuevo elemento…"
              value={newNames[panel.kind] ?? ""}
              onChange={(e) =>
                setNewNames((s) => ({ ...s, [panel.kind]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd(panel.kind);
              }}
            />
            <Button type="button" size="sm" onClick={() => void handleAdd(panel.kind)}>
              <Plus className="size-4" aria-hidden />
              Agregar
            </Button>
          </div>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 4: Implementar `src/app/catalogos/page.tsx`**

```tsx
import CatalogManager from "@/components/catalogs/CatalogManager";

export const dynamic = "force-dynamic";

export default function Page() {
  return <CatalogManager />;
}
```

- [ ] **Step 5: Correr tests y verificar que pasan**

```bash
npm test && npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalogs src/app/catalogos tests/catalogs-page.test.tsx && git commit -m "feat(catalogs): administración CRUD de tipos, modalidades y dependencias"
```

---

### Task 18: Verificación final, README y guía de despliegue

**Files:**
- Create: `README.md`
- Modify: `.env.example` (solo si faltó alguna variable)

- [ ] **Step 1: Verificación completa local**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
```

Expected: todo verde. `npm run build` puede correr sin variables de entorno porque todas las páginas son `force-dynamic` (no hay prerenderizado que toque la BD).

- [ ] **Step 2: Crear `README.md`**

```markdown
# Ecosistema de Orientación Vocacional

Aplicación web colaborativa con sincronización en vivo para mapear el ecosistema de
orientación vocacional: una matriz de 5 etapas (columnas) × 7 dimensiones (filas),
catálogos administrables, una sección de análisis con gráfica de nodos y dashboard
estadístico. Construida con Next.js 15 + Supabase (PostgreSQL + Realtime) y desplegada
en Vercel.

## Requisitos

- Node.js 20+
- Un proyecto en [supabase.com](https://supabase.com) (plan gratuito es suficiente)

## Puesta en marcha

1. **Base de datos:** en el SQL Editor de tu proyecto Supabase ejecuta
   `supabase/schema.sql` y después `supabase/seed.sql`.
2. **Variables de entorno:** copia `.env.example` a `.env.local` y completa:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API, `service_role`)
   - `SUPABASE_JWT_SECRET` (Settings → API → JWT Settings → JWT Secret)
   - `ACCESS_PIN` (el PIN compartido de las sesiones de trabajo)
   - `SESSION_SECRET` (cadena aleatoria de 32+ caracteres)
3. `npm install`
4. `npm run dev` y abre http://localhost:3000 — te pedirá nombre, dependencia y PIN.

## Pruebas

```bash
npm test        # vitest (unitarios + render)
npx tsc --noEmit
npm run lint
npm run build
```

## Despliegue en Vercel

1. Sube el repositorio a GitHub e importa el proyecto en Vercel.
2. Configura las 6 variables de entorno de `.env.example` en el proyecto de Vercel.
3. Despliega. El middleware protege todas las rutas: sin PIN válido no se puede
   leer ni escribir información (RLS de Supabase bloquea el rol `anon`).

## Seguridad

- El PIN se valida solo en el servidor (`ACCESS_PIN`) con rate limiting por IP.
- La sesión es una cookie `httpOnly` firmada (JWT HS256, `SESSION_SECRET`).
- El canal Realtime se autentica con un JWT `role: authenticated` firmado con
  `SUPABASE_JWT_SECRET`; las políticas RLS solo permiten `SELECT` a ese rol.
- Cada registro guarda quién lo creó y quién lo editó (nombre + dependencia).
```

- [ ] **Step 3: Smoke test manual (con BD configurada)**

Con `.env.local` completo y SQL aplicado:
1. `npm run dev`, abrir dos navegadores (uno normal, uno incógnito).
2. Ingresar en ambos con distinto nombre/dependencia y el mismo PIN.
3. Crear un registro en una sesión → debe aparecer al instante en la otra.
4. Verificar: acordeones de Dimensión 3, filtros, `/analisis` (grafo y gráficas),
   `/catalogos` (agregar/ordenar/activar/eliminar).
5. Verificar que `http://localhost:3000` en un tercer navegador sin sesión redirige a `/acceso`.

- [ ] **Step 4: Commit final**

```bash
git add README.md .env.example && git commit -m "docs: README con puesta en marcha, pruebas y despliegue en Vercel"
```

---

## Self-Review (verificado al escribir este plan)

- **Cobertura de la spec:** matriz 5×7 (Task 10-11), campos extendidos Dimensión 3 (Task 3, 9, 12), catálogos administrables (Task 17), realtime (Task 8), PIN + autoría (Task 4-6, 9), grafo por atributos (Task 14, 16), dashboard (Task 15), Vercel + SQL + RLS (Task 2, 18).
- **Nombres consistentes:** `rowToRecord`, `applyRecordEvent`, `buildCreateRow/buildUpdateRow`, `CATALOG_TABLES`, `filterMatrixRecords` (matriz) vs `filterRecords` (grafo), `getRecordFormSchema`.
- **Sin placeholders:** cada paso incluye código o comandos completos.
