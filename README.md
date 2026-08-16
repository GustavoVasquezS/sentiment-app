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

2 proveedores: **Render** (backend `apps/api`, microservicio `services/ml`,
Postgres) y **Vercel** (frontend `apps/web`). Actualizado respecto al plan
original (que apuntaba a Railway para el backend) porque el trial de
Railway del usuario caducó y ya tiene plan Hobby pago en Render — mismo
principio de 2 proveedores, distinto proveedor para el lado backend.

Orden recomendado (ver checklist completo de secretos en la sección 9 del
plan, `C:\Users\light\.claude\plans\este-es-un-proyecto-humble-giraffe.md`):

1. **Rotar los secretos filtrados en los repos viejos** (urgente, no depende de nada más): contraseña de la Postgres vieja en Render, JWT secret hardcodeado, API key de Resend, app password de Gmail.
2. Crear el repo `sentiment-app` en GitHub y pushear.
3. En Render, dentro de la misma cuenta:
   - Crear una **PostgreSQL** nueva (plan pago, no la free de 90 días) → copiar la `Internal Database URL`.
   - Crear un **Private Service** para `services/ml` (root directory `services/ml`, build con su `Dockerfile`) — al ser privado, solo lo alcanzan otros servicios de la cuenta, no internet.
   - Crear un **Web Service** para `apps/api` (root directory `apps/api`, build con su `Dockerfile`) con env vars: `DATABASE_URL` (la Internal Database URL de arriba), `JWT_SECRET` (nuevo, alta entropía), `ML_API_BASE_URL` (URL interna del Private Service de `ml`), `RESEND_API_KEY` (la nueva, del paso 1), `FRONTEND_URL` (la URL de Vercel del paso 4), `ALLOWED_ORIGINS` (la URL de Vercel).
   - Correr `npx prisma migrate deploy` contra la Postgres nueva (desde el Shell de Render o localmente apuntando `DATABASE_URL` a la External Database URL).
4. En Vercel: importar `apps/web`, con `VITE_API_BASE_URL` apuntando a la URL pública del Web Service de `api` en Render.
5. Smoke test end-to-end contra las URLs de producción.
6. Dar de baja los servicios viejos (la API de ML vieja y la Postgres vieja en Render, el backend Java viejo en Railway).

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
- ⏳ Pendiente: el corte de despliegue + rotación de secretos descritos en el plan (necesita acceso a las cuentas de Railway/Vercel/Resend).
