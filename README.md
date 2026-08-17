# Sentiment App

Reconstrucción unificada del proyecto de análisis de sentimientos (bootcamp
Hackathon ONE / No Country), antes desparramado en 6 repos. Plan completo en
`C:\Users\light\.claude\plans\este-es-un-proyecto-humble-giraffe.md`.

## Estructura

```
apps/api/       Backend Node + Express + TypeScript + Prisma (PostgreSQL)
apps/web/       Frontend React + TypeScript + Vite + Tailwind
services/ml/    Microservicio Python FastAPI (modelo scikit-learn ES/PT)
```

## Requisitos

- Node.js 20+
- Python 3.11+ (para `services/ml`)
- Docker (opcional pero recomendado para levantar Postgres + ml + api juntos)

## Desarrollo local

### Opción rápida: docker-compose

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp services/ml/.env.example services/ml/.env
docker compose up --build
```

Esto levanta `postgres` (5432), `ml` (8000) y `api` (8080). El frontend se
corre aparte (no está en el compose a propósito):

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

Antes del primer arranque de `api`, aplicar las migraciones y el seed:

```bash
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
```

### Sin Docker

```bash
npm install                 # instala apps/api y apps/web (workspaces npm)
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
npm run dev:api              # apps/api en :8080
npm run dev:web              # apps/web en :5173

cd services/ml
python -m venv .venv && .venv/Scripts/activate  # o source .venv/bin/activate en Unix
pip install -r requirements.txt
python main.py                # :8000
```

## Tests

```bash
npm run test:unit -w apps/api          # no requiere base de datos
npm run test:integration -w apps/api   # requiere Postgres real (docker compose up postgres + migraciones)
npm run typecheck:test -w apps/api     # typecheck de src + test/

cd services/ml && pip install -r requirements-dev.txt && pytest
```

Los tests de integración cubren: `auth` (registro/login/rechazo de rutas
protegidas), `categoria` (CRUD, paginación, aislamiento entre usuarios),
`producto` (creación ligada a categoría propia, listado por categoría,
aislamiento entre usuarios) y `sesion`/`csv` (análisis simple y por
producto, detección de menciones por nombre, actualización de contadores,
auto-creación de categoría/producto desde CSV, historial paginado) — estos
últimos con el cliente ML mockeado (`test/helpers/mockMlClient.ts`) para no
depender del microservicio Python real.

## Despliegue

✅ **Desplegado y verificado en producción** (2026-08-17). 2 proveedores:
**Render** (backend `apps/api`, microservicio `services/ml`, Postgres) y
**Vercel** (frontend `apps/web`). Adaptado respecto al plan original —
apuntaba a Railway para el backend, pero el trial de Railway caducó
durante el despliegue; se migró todo a Render (donde el usuario ya tenía
plan Hobby pago) manteniendo el mismo principio de 2 proveedores.

**URLs de producción:**
- Frontend: `https://sentiment-app-web.vercel.app`
- Backend: `https://sentiment-app-api.onrender.com/project/api/v2` (docs en `/docs`)
- ML: `https://sentiment-app-ml.onrender.com`

**Servicios en Render** (`sentiment-app-db`, `sentiment-app-api`, `sentiment-app-ml`)
— los tres en la región Oregon. `services/ml` y `apps/api` corren en el
plan **Free** (no en Private Service / plan pago como planeaba la sección
8 del plan original — restricción de presupuesto real del usuario), así
que ambos se duermen tras 15 min de inactividad. Mitigación: `ml.client.ts`
usa un timeout de 60s (ver commit `7222a12`) para tolerar el cold start
verificado en producción (~41s); opcionalmente se puede armar un ping
externo gratuito (cron-job.org / UptimeRobot) a `/health` de ambos cada
10-14 min para que no lleguen a dormirse.

Checklist de rotación de secretos (sección 9 del plan) — **completo**:
Resend rotada, Gmail app password ya no vinculada, Postgres vieja de
Render auto-expirada (plan free, >90 días), JWT viejo sin efecto (el
backend Java que lo usaba ya no existe, Railway caducado).

Pasos seguidos (para referencia / repetir en otro entorno):
1. Rotar secretos filtrados en los repos viejos.
2. Crear el repo `sentiment-app` en GitHub y pushear.
3. En Render: Postgres nueva → Web Service `ml` (Free, root `services/ml`) → Web Service `api` (Free, root `apps/api`, con las 8 env vars) → `prisma migrate deploy` contra la Internal/External Database URL.
4. En Vercel: importar `apps/web`, root directory `apps/web`, env var `VITE_API_BASE_URL` apuntando al `api` de Render.
5. Actualizar `FRONTEND_URL`/`ALLOWED_ORIGINS` en `api` con la URL real de Vercel (necesario para que el CORS deje pasar al frontend).
6. Smoke test end-to-end (health, registro, login, análisis de sentimiento, preflight CORS) — todo verificado con curl antes de probar la UI real.

## Documentación de la API

Con `api` corriendo: `http://localhost:8080/project/api/v2/docs` (Swagger UI,
generado desde los esquemas zod — ver `apps/api/src/openapi/registry.ts`).

## CI

`.github/workflows/ci.yml` — un workflow con tres jobs en paralelo (`api`,
`ml`, `web`), corre en cada push a `main` y en cada pull request:

- **api**: levanta un service container de `postgres:17`, `prisma migrate deploy` contra esa base, lint, typecheck (`src` y `test`), tests unitarios + de integración, build.
- **ml**: `pytest` contra el microservicio Python.
- **web**: lint, typecheck, build.

Todos los comandos que corre el workflow se probaron localmente antes de
escribirlo (lint, typecheck, build y test:unit de ambos paquetes, y pytest
del servicio ML) — lo único que no se pudo ejercitar en este entorno de
desarrollo es la aplicación real de la migración contra una Postgres viva,
ya que no hay Docker/Postgres disponibles acá.

## Estado de la migración

- ✅ `services/ml`: movido desde `sentiment_api_render`, CORS restringido, tests pytest formalizados (10/10 verificados contra el modelo real).
- ✅ `apps/api`: esquema Prisma completo (con la migración inicial ya generada en `prisma/migrations/`), auth (JWT+bcrypt+reset por email), categoria/producto/sentiment/sesion/csv, paginación en categoria/producto/sesion (incluye `/sesion/historial`), OpenAPI, tests base (unit verificados; integración requiere Postgres real).
- ✅ `apps/web`: migración completa a TypeScript — 100% de `src/` es `.ts`/`.tsx` (salvo `tailwind.config.js`, estándar en proyectos Tailwind). Código muerto eliminado (`src/pages/`, `dist/` commiteado, bug de archivo sin extensión en `utils/formatName`, URLs hardcodeadas a `localhost` en `CategorySelectionView`/`ProductSelectionView`). Build (`npm run build`) y typecheck (`npm run typecheck`) verificados sin errores.
- ✅ Tests de integración: `auth`, `categoria`, `producto`, `sesion` y `csv` (con cliente ML mockeado). Compilan y corren limpio; requieren Postgres real para pasar (no disponible en este entorno de desarrollo — se verificó solo la compilación/estructura).
- ✅ CI: `.github/workflows/ci.yml` con los tres jobs descritos arriba.
- ✅ Despliegue + rotación de secretos: completo, ver sección "Despliegue" arriba. Verificado end-to-end contra producción real (registro, login, análisis de sentimiento, CORS).
- ⏳ Pendiente (opcional, no bloqueante): ping externo gratuito para evitar cold starts del plan Free en demos; tests de integración de categoria/producto/sesion/csv corridos contra una Postgres real (por ahora solo verificados en compilación/estructura).
