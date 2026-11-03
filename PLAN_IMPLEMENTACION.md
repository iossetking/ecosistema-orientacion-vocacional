# Plan de Implementación: Ecosistema de Orientación Vocacional (Mapa de Trayectoria Vocacional)

## 1. Resumen del Proyecto
Aplicación web colaborativa con **sincronización en tiempo real** diseñada para mapear, diagnosticar y analizar el ecosistema de orientación vocacional desde el bachillerato (Media Superior) hasta el primer año de pregrado (Superior). Desplegada en **Vercel** utilizando **Next.js (App Router)** y **Supabase (PostgreSQL + Realtime)**.

### Objetivos Clave
1. **Matriz Interactiva Etapa × Dimensión:** Vista principal con 5 etapas (columnas) y 7 dimensiones (filas) para registrar y consultar elementos del ecosistema vocacional.
2. **Sincronización en Vivo:** Cualquier creación, edición, eliminación de registros o actualización de catálogos se refleja al instante en todas las sesiones conectadas mediante WebSockets (`Supabase Realtime`).
3. **Esquema Diferenciado de Registros:** Soporte para registros estándar (6 dimensiones) y registros extendidos agrupados por categoría para la dimensión *"Acciones y recursos actuales"*.
4. **Administración Manual de Catálogos:** Sección dedicada para gestionar *Tipos de acción o recurso*, *Modalidades* y *Dependencias participantes* fuera del formulario de captura.
5. **Sección de Análisis y Gráfica de Nodos:** Visualización interactiva mediante un grafo de nodos conectado automáticamente por atributos compartidos (etapas, dependencias y dimensiones) más un dashboard de gráficas estadísticas.
6. **Acceso Blindado por PIN + Trazabilidad de Participantes:** Control de acceso seguro validado en el servidor (con RLS activo en Supabase bloqueando accesos sin PIN) e identificación ligera al ingresar (*Nombre* + *Dependencia* + *PIN*) para registrar quién creó y quién editó cada elemento.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework Web** | Next.js 15 (App Router, TypeScript) | Renderizado híbrido, rutas API, middleware de acceso y despliegue nativo en Vercel |
| **Estilos y UI** | Tailwind CSS + `shadcn/ui` + `lucide-react` | Diseño fiel a la matriz de referencia, modales, acordeones, badges y filtros |
| **Base de Datos y Realtime** | Supabase (PostgreSQL + Realtime) | Almacenamiento relacional y sincronización en vivo vía `postgres_changes` |
| **Gráfica de Nodos** | `@xyflow/react` (React Flow) + `d3-force` | Grafo interactivo de nodos y conexiones con layout automático, filtros y zoom |
| **Gráficas Analíticas** | `recharts` | Gráficas estadísticas (distribución por estado, etapa, dependencia y tipo de acción) |
| **Formularios y Validación** | `react-hook-form` + `zod` | Validación condicional según la dimensión seleccionada |
| **Despliegue** | Vercel | Hosting serverless con integración continua |

---

## 3. Estructura de la Matriz (Dominio)

### 3.1 Columnas: Las 5 Etapas de la Orientación Vocacional
| # | Clave | Nombre de la Etapa | Subtítulo / Nivel | Color Tema | Ícono |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | `etapa_1` | **1. Autoconocimiento** | Primer año del Bachillerato General *(Media Superior - 1er año)* | Verde lima (`#c8f59b`) | `Compass` |
| **2** | `etapa_2` | **2. Exploración educativa y profesional** | Segundo año del bachillerato *(Media Superior - 2do año)* | Turquesa (`#a8edea`) | `Search` |
| **3** | `etapa_3` | **3. Decisión y planificación de carrera** | Tercer año del bachillerato *(Media Superior - 3er año)* | Amarillo (`#fde68a`) | `Target` |
| **4** | `etapa_4` | **4. Preparación y transición** | Egreso del bachillerato y transición a la educación superior u otras alternativas *(Transición / Admisión)* | Lavanda (`#e9d5ff`) | `ArrowLeftRight` |
| **5** | `etapa_5` | **5. Permanencia y arraigo** | Primer año de licenciatura *(Superior - 1er año)* | Azul cielo (`#bfdbfe`) | `Anchor` |

### 3.2 Filas: Las 7 Dimensiones
| # | Clave | Nombre de la Dimensión | Pregunta Guía | Tipo de Formulario |
| :- | :--- | :--- | :--- | :--- |
| **1** | `necesidades` | **Necesidades del estudiante** | ¿Qué requiere el estudiantado en esta etapa? | Estándar |
| **2** | `caracteristicas` | **Características y condiciones** | ¿Qué características o condiciones influyen en la trayectoria? | Estándar |
| **3** | `acciones_recursos` | **Acciones y recursos actuales** | ¿Qué se ofrece, quién lo organiza y cómo se realiza? | **Extendida (Agrupada por Tipo)** |
| **4** | `datos_seguimiento` | **Datos y seguimiento** | ¿Qué información se genera y qué información se requiere? | Estándar |
| **5** | `vacios_barreras` | **Vacíos o barreras** | ¿Qué falta o dificulta avanzar? | Estándar |
| **6** | `areas_articulacion` | **Áreas de articulación** | ¿Qué acciones, recursos o dependencias podrían vincularse? | Estándar |
| **7** | `mejoras_propuestas` | **Mejoras propuestas** | ¿Qué debería fortalecerse, actualizarse o desarrollarse? | Estándar |

### 3.3 Estados del Registro
| Clave | Etiqueta | Color Indicador |
| :--- | :--- | :--- |
| `no_existe` | No existe | Rojo (`#ef4444`) |
| `no_funciona` | No funciona | Naranja (`#f97316`) |
| `posible_duplicado` | Posible Duplicado | Morado (`#a855f7`) |
| `existe_y_funciona` | Existe y Funciona | Verde (`#10b981`) |
| `requiere_fortalecimiento` | Requiere fortalecimiento o actualización | Azul (`#3b82f6`) |
| `sin_clasificar` | Sin clasificar | Gris (`#9ca3af`) |

---

## 4. Esquema de Base de Datos (Supabase PostgreSQL)

```sql
-- 1. Enum de Estados del Registro
CREATE TYPE record_status AS ENUM (
  'no_existe',
  'no_funciona',
  'posible_duplicado',
  'existe_y_funciona',
  'requiere_fortalecimiento',
  'sin_clasificar'
);

-- 2. Catálogo: Tipos de Acción o Recurso (Administrable en sección de Catálogos)
CREATE TABLE catalog_action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Catálogo: Modalidades (Administrable en sección de Catálogos)
CREATE TABLE catalog_modalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Catálogo: Dependencias Participantes (Administrable en sección de Catálogos)
CREATE TABLE catalog_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabla Principal: Registros de la Matriz
CREATE TABLE matrix_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id SMALLINT NOT NULL CHECK (dimension_id BETWEEN 1 AND 7),
  primary_stage_id SMALLINT NOT NULL CHECK (primary_stage_id BETWEEN 1 AND 5),
  related_stage_ids SMALLINT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  status record_status NOT NULL DEFAULT 'sin_clasificar',

  -- Campos exclusivos para Dimensión 3 ("Acciones y recursos actuales")
  action_name TEXT,
  action_type_id UUID REFERENCES catalog_action_types(id) ON DELETE SET NULL,
  organizer TEXT,
  executor TEXT,
  modality_id UUID REFERENCES catalog_modalities(id) ON DELETE SET NULL,

  -- Trazabilidad de autoría (Nombre y Dependencia del participante en sesión)
  created_by_name TEXT NOT NULL,
  created_by_dependency TEXT NOT NULL,
  updated_by_name TEXT NOT NULL,
  updated_by_dependency TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabla Pivote: Dependencias Participantes por Registro (N:M)
CREATE TABLE record_dependencies (
  record_id UUID NOT NULL REFERENCES matrix_records(id) ON DELETE CASCADE,
  dependency_id UUID NOT NULL REFERENCES catalog_dependencies(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, dependency_id)
);

-- 7. Seguridad Row Level Security (RLS): Bloqueo total a usuarios sin PIN (rol anon)
ALTER TABLE matrix_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_dependencies ENABLE ROW LEVEL SECURITY;

-- Solo sesiones que validaron el PIN (rol 'authenticated') pueden leer/escuchar en Realtime
CREATE POLICY "Allow authenticated read matrix_records"
  ON matrix_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read record_dependencies"
  ON record_dependencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read catalog_action_types"
  ON catalog_action_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read catalog_modalities"
  ON catalog_modalities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read catalog_dependencies"
  ON catalog_dependencies FOR SELECT TO authenticated USING (true);

-- 8. Habilitar Realtime para todas las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE
  matrix_records,
  record_dependencies,
  catalog_action_types,
  catalog_modalities,
  catalog_dependencies;
```

### Semilla Inicial (`seed.sql`)
- **Dependencias:** `SEMS`, `CGAI`, `CSE`, `Centros Universitarios`, `Escuelas Preparatorias`, `Otros`.
- **Tipos de Acción o Recurso:** `Test vocacionales`, `Asesorías personalizadas`, `Talleres o charlas`, `Cursos o simuladores`, `Ferias y exposiciones`, `Otras (especificar)`.
- **Modalidades:** `Presencial`, `Virtual`, `Híbrida`, `Autogestiva`.

---

## 5. Arquitectura de Módulos y Vistas

### 5.1 Pantalla de Acceso Blindado por PIN + Identificación (`/acceso`)
- **Formulario de Entrada:** Solicita tres datos al participante para iniciar su sesión colaborativa:
  1. **Nombre del participante** (ej. *Ana García*)
  2. **Dependencia a la que pertenece** (ej. *SEMS*, *CGAI*, *CSE*, *Centros Universitarios*, *Escuelas Preparatorias*, *Otros*)
  3. **PIN de acceso compartido**
- **Blindaje de Seguridad en el Servidor (`/api/auth/pin`):**
  - El PIN se valida exclusivamente en el servidor contra `process.env.ACCESS_PIN` (nunca se expone al cliente) con protección contra intentos por fuerza bruta (*rate limiting*).
  - Al ser válido, el servidor emite una cookie `httpOnly` firmada criptográficamente (`SESSION_SECRET`) que almacena `{ name, dependency }` y un token JWT con rol `authenticated` para el canal Realtime de Supabase.
  - Todas las escrituras (crear, editar o eliminar registros y catálogos) se realizan mediante **Server Actions / API Routes** que verifican la cookie firmada e inyectan automáticamente `created_by_name`, `created_by_dependency`, `updated_by_name` y `updated_by_dependency`.
  - `middleware.ts` protege todas las rutas de la aplicación y redirige a `/acceso` si no existe una sesión válida.

### 5.2 Vista 1: Matriz Etapa × Dimensión (`/` — Vista Principal)
- **Header Superior:**
  - Título `Matriz etapa × dimensión`.
  - Badge reactivo `((•)) Sincronización en vivo` (verde cuando el canal WebSocket está `SUBSCRIBED`, ámbar en reconexión).
  - Indicador del participante activo (`Nombre · Dependencia`) con opción de cerrar/cambiar sesión.
  - Barra de filtros (por Dependencia, Estado, Etapa y texto libre) + contador `X de Y registros`.
  - Botón `+ Nuevo registro`.
- **Encabezados de Columna (Etapas 1 a 5):** Tarjetas coloreadas con ícono, número de etapa, título, subtítulo y popover informativo `(i)`.
- **Encabezados de Fila (Dimensiones 1 a 7):** Tarjetas azul marino (`#0f2547`) con ícono, nombre de la dimensión, pregunta guía y popover `(i)`.
- **Celdas de Dimensiones Estándar (Filas 1, 2, 4, 5, 6, 7):**
  - Lista de tarjetas con punto de color del `status`, `description` y botón `(i)` para abrir el modal de detalle/edición.
  - Botón inferior `+ Agregar registro` que abre el modal precargando `dimension_id` y `primary_stage_id`.
- **Celdas de "Acciones y recursos actuales" (Fila 3):**
  - Agrupación automática en acordeones colapsables por `Tipo de acción o recurso` (ej. `v TEST VOCACIONALES [3]`).
  - Cada ítem dentro del acordeón muestra punto(s) de estado y `action_name`, abriendo al hacer clic su ficha completa (*Nombre, Tipo, Quién organiza, Quién ejecuta, Modalidad, Descripción, Etapas relacionadas, Dependencias, Estado*).
- **Pie de Matriz:** Barra visual de línea de trayectoria (*1er año, 2do año, 3er año — Media Superior | Transición / Admisión | 1er año — Superior*).

### 5.3 Vista 2: Sección de Análisis y Gráfica de Nodos (`/analisis`)
1. **Gráfica Interactiva de Nodos (`@xyflow/react` + `d3-force`):**
   - **Nodos de Registros:** Coloreados según su `Estado` y etiquetados con su `Dimensión` y `Etapa`.
   - **Modos de Conexión Automática (Selector en vivo):**
     - *Por Etapas Relacionadas:* Conecta los registros con las etapas en las que impactan (`primary_stage_id` + `related_stage_ids`), evidenciando la continuidad transversal entre bachillerato y licenciatura.
     - *Por Dependencias Participantes:* Conecta los registros con los nodos de dependencias (`SEMS`, `CGAI`, `CSE`, etc.), mostrando qué actores concentran esfuerzos o pueden articularse.
     - *Ecosistema Completo:* Vista combinada donde al seleccionar cualquier nodo se resalta su vecindario conectado y se abre un panel lateral con sus detalles.
   - **Filtros del Grafo:** Filtrado inmediato por Etapa, Dimensión, Dependencia y Estado.
2. **Dashboard de Gráficas Estadísticas (`Recharts`):**
   - **KPI Cards:** Total de registros, % que *Existe y funciona*, % que *Requiere fortalecimiento*, total de *Vacíos o barreras*.
   - **Gráfica 1 (Dona/Barras):** Distribución de registros por **Estado**.
   - **Gráfica 2 (Barras Apiladas):** Cantidad de registros por **Etapa y Estado**.
   - **Gráfica 3 (Mapa de Calor / Matriz de Densidad):** Concentración de registros en la cuadrícula **Etapa × Dimensión**.
   - **Gráfica 4 (Barras Horizontales):** Participación e involucramiento por **Dependencia Participante**.
   - **Gráfica 5 (Treemap / Barras):** Distribución de **Acciones y recursos actuales** por *Tipo de acción* y *Modalidad*.

### 5.4 Vista 3: Administración de Catálogos (`/catalogos`)
- Tres paneles CRUD sincronizados en tiempo real para agregar, editar nombre, ordenar o activar/desactivar:
  1. **Tipos de acción o recurso** (usados en la Dimensión 3).
  2. **Modalidades** (usadas en la Dimensión 3).
  3. **Dependencias participantes** (usadas en todas las dimensiones).
- Nota: Los formularios de registro consumen únicamente las opciones activas de estos catálogos sin permitir crear catálogos ad-hoc desde el formulario.

---

## 6. Estructura de Archivos del Proyecto

```text
ecosistema-orientacion-vocacional/
├── supabase/
│   ├── schema.sql                  # Tablas, enums, índices y publicación Realtime
│   └── seed.sql                    # Catálogos base y datos de ejemplo
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout global, proveedor Realtime y navegación
│   │   ├── page.tsx                # Vista principal: Matriz Etapa x Dimensión
│   │   ├── analisis/
│   │   │   └── page.tsx            # Vista de Análisis: Grafo de Nodos + Gráficas Recharts
│   │   ├── catalogos/
│   │   │   └── page.tsx            # Vista de Administración manual de Catálogos
│   │   ├── acceso/
│   │   │   └── page.tsx            # Pantalla de ingreso por PIN
│   │   └── api/
│   │       └── auth/pin/route.ts   # Validación de PIN y emisión de cookie httpOnly
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Navegación, estado "Sincronización en vivo" y filtros
│   │   │   └── TrajectoryFooter.tsx# Barra inferior Media Superior -> Transición -> Superior
│   │   ├── matrix/
│   │   │   ├── MatrixBoard.tsx     # Cuadrícula 5 Etapas x 7 Dimensiones
│   │   │   ├── StageHeader.tsx     # Encabezados de las 5 etapas
│   │   │   ├── DimensionHeader.tsx # Encabezados de las 7 dimensiones
│   │   │   ├── StandardCell.tsx    # Celda para dimensiones 1, 2, 4, 5, 6, 7
│   │   │   ├── ActionsCell.tsx     # Celda agrupada en acordeones para dimensión 3
│   │   │   ├── RecordCard.tsx      # Tarjeta individual con punto de estado e ícono (i)
│   │   │   ├── RecordFormModal.tsx # Modal crear/editar (condicional estándar vs dimensión 3)
│   │   │   └── RecordDetailDrawer.tsx # Vista detallada de un registro
│   │   ├── analysis/
│   │   │   ├── EcosystemNodeGraph.tsx # Grafo interactivo (@xyflow/react + d3-force)
│   │   │   ├── GraphControls.tsx   # Selector de modo de conexión y filtros del grafo
│   │   │   └── ChartsDashboard.tsx # Panel de 5 gráficas estadísticas con Recharts
│   │   └── catalogs/
│   │       └── CatalogManager.tsx  # CRUD de Tipos de acción, Modalidades y Dependencias
│   ├── constants/
│   │   └── matrix-config.ts        # Definición estática de las 5 Etapas, 7 Dimensiones y 6 Estados
│   ├── hooks/
│   │   └── useRealtimeMatrix.ts    # Estado global + suscripción WebSocket a Supabase Realtime
│   ├── lib/
│   │   ├── supabase/client.ts      # Cliente Supabase navegador
│   │   ├── supabase/server.ts      # Cliente Supabase servidor
│   │   └── graph-builder.ts        # Algoritmo generador de nodos y aristas para React Flow
│   ├── types/
│   │   └── matrix.ts               # Interfaces TypeScript y esquemas Zod
│   └── middleware.ts               # Protección de rutas por PIN
├── .env.example
└── package.json
```

---

## 7. Fases de Implementación Paso a Paso

### Fase 1: Inicialización, Base de Datos y Acceso Blindado
1. Inicializar proyecto Next.js 15 con TypeScript, Tailwind CSS y `shadcn/ui`.
2. Crear `supabase/schema.sql` y `supabase/seed.sql` con las tablas, relaciones, políticas RLS y publicación `supabase_realtime`.
3. Configurar clientes Supabase (`client.ts`, `server.ts`), constantes de dominio (`matrix-config.ts`) y tipos (`matrix.ts`).
4. Implementar el acceso blindado por PIN + identificación de participante (`/acceso`, `/api/auth/pin`, `middleware.ts`) con sesión firmada `httpOnly` y *rate limiting*.

### Fase 2: Motor de Sincronización en Vivo y Sección de Catálogos
1. Construir el hook/provider `useRealtimeMatrix` que carga el estado inicial y escucha eventos `INSERT`, `UPDATE` y `DELETE` en tiempo real sobre registros y catálogos, exponiendo el estado del socket (`Sincronización en vivo`).
2. Desarrollar la vista `/catalogos` (`CatalogManager.tsx`) para administrar manualmente **Tipos de acción o recurso**, **Modalidades** y **Dependencias participantes**.

### Fase 3: Vista Principal de Matriz Etapa × Dimensión
1. Construir `MatrixBoard.tsx`, `StageHeader.tsx`, `DimensionHeader.tsx` y `TrajectoryFooter.tsx` replicando fielmente el diseño visual de referencia.
2. Implementar `StandardCell.tsx` para las 6 dimensiones estándar y `ActionsCell.tsx` con acordeones agrupados por *Tipo de acción o recurso* para la Dimensión 3.
3. Implementar `RecordFormModal.tsx` con validación Zod condicional (mostrando los campos extendidos cuando `dimension_id === 3`) y `RecordDetailDrawer.tsx`.
4. Añadir barra de búsqueda y filtros globales en vivo.

### Fase 4: Sección de Análisis y Gráfica de Nodos
1. Desarrollar `graph-builder.ts` para transformar los registros, sus etapas relacionadas y sus dependencias en nodos y aristas con layout de fuerzas/jerárquico.
2. Construir `EcosystemNodeGraph.tsx` con `@xyflow/react`, permitiendo alternar el modo de conexión, filtrar nodos, hacer zoom e inspeccionar registros al hacer clic.
3. Construir `ChartsDashboard.tsx` con `Recharts` para las gráficas de estado, etapa, calor Etapa × Dimensión, dependencias y tipos/modalidades de acciones.

### Fase 5: Verificación y Despliegue en Vercel
1. Pruebas unitarias del generador del grafo (`graph-builder.test.ts`) y validación de formularios.
2. Verificación de compilación (`npm run build`, `tsc --noEmit`, `npm run lint`).
3. Configuración de variables de entorno en Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `ACCESS_PIN`, `SESSION_SECRET`) y despliegue a producción.
