# Ecosistema de Orientación Vocacional

Aplicación web colaborativa con sincronización en vivo para mapear el ecosistema de
orientación vocacional: una matriz de 5 etapas (columnas) × 7 dimensiones (filas),
catálogos administrables, una sección de análisis con gráfica de nodos y dashboard
estadístico. Construida con Next.js 15 + Supabase (PostgreSQL + Realtime) y desplegada
en Vercel.

## Requisitos

- Node.js 20.19+ (o 22+, requerido por Tailwind CSS v4)
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

## Pruebas y verificación

```bash
npx tsc --noEmit
npm run lint
npm run build
npm test
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
