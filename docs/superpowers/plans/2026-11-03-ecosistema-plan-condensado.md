# Plan Condensado de Implementación — Ecosistema de Orientación Vocacional

> Versión ejecutiva del plan SDD. **Sin pruebas unitarias** (decisión del usuario por economía de tokens). La calidad se garantiza con `tsc --noEmit` + `eslint` + `next build` y revisión de código en línea. Sustituye al plan detallado de 18 tareas; la especificación funcional sigue siendo `PLAN_IMPLEMENTACION.md`.

**Stack:** Next.js 15.5 (App Router, TS, `src/`) · Tailwind + shadcn/ui · Supabase (PostgreSQL + Realtime) · `@xyflow/react` + d3-force · recharts · react-hook-form + zod 4 · jose.

**Invariantes de seguridad (no negociables):**
1. PIN validado solo en servidor (`ACCESS_PIN`) con rate-limit por IP; cookie de sesión `httpOnly` firmada JWT HS256 (`SESSION_SECRET`).
2. RLS en Supabase: rol `anon` sin acceso; solo `authenticated` lee. Mutaciones solo vía Server Actions (service role) tras verificar la cookie.
3. Realtime autenticado con JWT `role: authenticated` firmado con `SUPABASE_JWT_SECRET`.
4. Cada registro guarda `created_by_*` / `updated_by_*` (nombre + dependencia de la sesión).

---

## Task 1 — Scaffold *(COMPLETADA, commit 74f9b71)*
Next.js 15.5.18 + deps + shadcn/ui (12 componentes) + vitest configurado (sin archivos de test).

## Task 2 — BD, dominio y autenticación
**Files:** `supabase/schema.sql`, `supabase/seed.sql`, `src/types/matrix.ts`, `src/constants/matrix-config.ts`, `src/lib/auth/{session,supabase-jwt,rate-limit,protect}.ts`, `src/app/api/auth/{pin,logout,token}/route.ts`, `src/middleware.ts`, `src/app/acceso/page.tsx`.
- SQL: 3 catálogos + `matrix_records` (campos extendidos Dim 3 + autoría) + pivote `record_dependencies`, RLS SELECT-only para `authenticated`, publicación realtime.
- Dominio: 5 etapas (colores/iconos), 7 dimensiones, 6 estados; esquemas zod base y extendido (Dim 3).
- Auth: `/api/auth/pin` (valida PIN + setea cookie), `/api/auth/token` (JWT realtime), `/api/auth/logout`, middleware que redirige a `/acceso?next=…`, pantalla de acceso (nombre + dependencia + PIN).

## Task 3 — Datos y sincronización en vivo
**Files:** `src/lib/supabase/{server,client}.ts`, `src/lib/data.ts` (snapshot + `rowToRecord`), `src/hooks/useRealtimeMatrix.tsx` (provider + aplicadores puros de eventos), `src/app/layout.tsx` (fetch del snapshot, provider, Navbar con usuario de sesión).

## Task 4 — Acciones y vista principal de matriz
**Files:** `src/lib/records/build-row.ts`, `src/lib/catalogs/tables.ts`, `src/app/actions/{records,catalogs}.ts`, `src/components/matrix/*` (icon-map, StageHeader, DimensionHeader, RecordCard, StandardCell, ActionsCell con acordeones por tipo, FilterBar, MatrixBoard 5×7, RecordFormModal condicional Dim 3, RecordDetailDrawer con autoría, MatrixWorkspace), `src/components/layout/{Navbar,NavbarShell,TrajectoryFooter}.tsx`, `src/app/page.tsx`.
- Server Actions: create/update/delete registro (zod + autoría de sesión + vínculos N:M) y CRUD de catálogos (create/update/swap/delete).

## Task 5 — Análisis y catálogos
**Files:** `src/lib/analysis/graph-builder.ts` (modos stages/dependencies/full), `src/lib/analysis/aggregate.ts` (kpis, por estado, etapa×estado, calor, dependencias, acciones por tipo/modalidad), `src/components/analysis/{EcosystemNodeGraph,GraphControls,ChartsDashboard,AnalysisWorkspace}.tsx`, `src/app/analisis/page.tsx`, `src/components/catalogs/CatalogManager.tsx`, `src/app/catalogos/page.tsx`.

## Task 6 — Verificación y entrega
`npx tsc --noEmit` · `npm run lint` · `npm run build` → todo verde. `README.md` (puesta en marcha, variables, SQL, despliegue Vercel). Smoke test manual con BD real (2 sesiones → cambios en vivo).

---

**Notas de entorno (del scaffold):** npm registry corporativo bloqueado → usar `NPM_CONFIG_REGISTRY=https://registry.npmmirror.com` si se requieren installs. zod 4 / recharts 3 / lucide 1 / resolvers 7 ya instalados.
