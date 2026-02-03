# Airbnb Backend (Milestones 1–6, modo MOCK)

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

## Base URL
- `http://localhost:3333`
- API: `http://localhost:3333/api`

## Health (orquestación / Docker)
- `GET /health` — liveness, responde `{ "ok": true }`
- `GET /ready` — readiness, responde `{ "ok": true, "ready": true }`

## Documentación API
Ver **`doks/backend/API.md`** para la lista completa de endpoints (Auth, Users, Properties, Bookings, Reviews, Favorites, Notifications, Host, Search) y ejemplos de request/response.
