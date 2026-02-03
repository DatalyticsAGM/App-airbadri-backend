# Airbnb Backend (Milestones 1–7, modo MOCK)

Backend API REST para el frontend: auth, propiedades, reservas, reviews, favoritos, notificaciones, dashboard host y búsqueda. Persistencia **en memoria** (mocks) cuando `USE_MEMORY_ONLY=true` o sin `MONGO_URI`.

## Requisitos
- Node.js 18+
- Opcional: MongoDB (solo si se desactiva modo memoria)

## Setup
1. Instalar dependencias: `npm install`
2. Crear `.env` basado en `.env.example` (definir al menos `JWT_SECRET`)
3. Modo **100% MOCK**: en `.env` usar `USE_MEMORY_ONLY=true` (no se conecta a MongoDB)
4. Desarrollo: `npm run dev`
5. Tests: `npm test` (compila y ejecuta tests con Node)
6. (Opcional) Poblar datos de ejemplo: `POST http://localhost:3333/api/dev/seed` (solo si `USE_MEMORY_ONLY=true` o `NODE_ENV=development`)

## Variables de entorno

| Variable | Descripción | Valores típicos |
|----------|-------------|------------------|
| `PORT` | Puerto del servidor | `3333` |
| `MONGO_URI` | URI de MongoDB (no usada si modo memoria) | `mongodb://127.0.0.1:27017/airbnb` |
| `USE_MEMORY_ONLY` | Persistencia solo en memoria | `true`, `1` (recomendado en dev) |
| `JWT_SECRET` | Secreto para firmar JWT **(obligatorio)** | Valor largo y aleatorio en producción |
| `JWT_EXPIRES_IN` | Caducidad del accessToken | `7d`, `24h` |
| `FRONTEND_ORIGIN` | Origen CORS del frontend | `http://localhost:3000` |
| `NODE_ENV` | Entorno | `development` \| `production` (afecta exposición de `/api/dev`) |

## Base URL
- `http://localhost:3333`
- API: `http://localhost:3333/api`

## Info y health (orquestación / Docker)
- `GET /api/info` — versión, `memoryOnly`, `env` (útil para integración).
- `GET /health` — liveness, responde `{ "ok": true }`.
- `GET /ready` — readiness, responde `{ "ok": true, "ready": true }`.

## Documentación API
- **`doks/backend/API.md`** — lista de endpoints (Auth, Users, Properties, Bookings, Reviews, Favorites, Notifications, Host, Search).
- **`doks/backend/STORES.md`** — contratos de los stores in-memory (Milestone 7).
