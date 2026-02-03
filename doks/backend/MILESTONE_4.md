# 🎯 Milestone 4 (Backend): Testing, Health y Preparación para Integración

## 📋 Fuente de verdad

- Frontend: `doks/frontend/MILESTONE_4.md` (Testing, optimización, preparación para producción)
- Reglas: `.cursor/rules/No-dependencias.mdc`

---

## 🎯 Objetivo

Preparar el backend para integración con frontend real y entorno tipo producción:

- Tests automatizados (unitarios y/o integración) de rutas y servicios clave.
- Endpoints de salud y readiness para despliegue.
- Documentación mínima de la API (o contrato estable) para que el frontend pueda consumirla con confianza.

Sin añadir dependencias innecesarias: priorizar Node/TS nativo; si se usan librerías de test, justificar (ej. Jest o Vitest ya habituales en el ecosistema).

---

## ✅ Principios / restricciones

- **No** agregar dependencias nuevas salvo las estrictamente necesarias para testing (p. ej. un runner de tests + supertest o similar para HTTP).
- Persistencia sigue siendo **in‑memory** en este milestone (MongoDB opcional más adelante).
- Código de producción no debe depender de código de test.

---

## 🧩 Milestone 4 — Tareas (máximo 5)

### 1) Configurar entorno de tests

**Alcance**

- Añadir script `test` en `package.json` (ej. `node --test` para Node nativo, o Jest/Vitest si se justifica).
- Estructura mínima: carpeta `tests/` o `src/__tests__/` con al menos un test de ejemplo que pase.
- Los tests deben poder ejecutarse con `npm test` sin levantar servidor externo (tests aislados).

**Criterios de aceptación**

- `npm test` ejecuta la suite y termina con código 0 si todo pasa.
- No se instalan más de una dependencia de testing si se puede evitar (Node 18+ tiene `node --test`).

---

### 2) Tests unitarios de stores y servicios críticos

**Alcance**

- Tests para lógica en memoria que no dependa de Express:
  - Store: p. ej. `memoryProperties`, `memoryBookings`, `memoryReviews` (create, list, update, delete, averageRating).
  - Servicios: funciones puras o que solo usen stores (p. ej. cálculo de totalPrice, solapamiento de fechas, `isPropertyAvailable`).
- No obligatorio cubrir 100%; priorizar rutas críticas: auth, properties, bookings.

**Criterios de aceptación**

- Al menos un store y un servicio con al menos 2–3 casos cada uno (éxito + error o borde).
- Tests deterministas (sin fechas/hora frágiles o con mocks controlados).

---

### 3) Tests de integración HTTP (rutas)

**Alcance**

- Tests que llamen a la API (app Express) con peticiones HTTP:
  - `GET /health` → 200.
  - `POST /api/auth/signup` → 201 y body con `user` y `accessToken`.
  - `POST /api/auth/login` con credenciales correctas → 200.
  - `GET /api/auth/me` sin token → 401; con token → 200 y `user`.
  - `GET /api/properties` → 200 y estructura `{ items, page, limit, total }`.
  - `GET /api/properties/:id` con id inexistente → 404.
- Usar la misma app (createApp) que en producción, sin levantar puerto (in-memory request/response o supertest).

**Criterios de aceptación**

- Al menos 5 rutas cubiertas con al menos un caso de éxito o error relevante.
- No depender de estado global entre tests (reiniciar app o stores por test si hace falta).

---

### 4) Endpoints de salud y readiness

**Alcance**

- `GET /health` (ya existente): mantener respuesta `{ "ok": true }` para liveness.
- Añadir (opcional) `GET /ready` o ampliar `GET /health` con:
  - Indicación de que la API está lista para recibir tráfico (p. ej. dependencias internas OK).
  - En modo solo-memoria: siempre listo; si en el futuro hubiera DB, aquí se podría comprobar la conexión.
- Documentar en README que el orquestador (Docker, K8s, etc.) puede usar `GET /health` para healthchecks.

**Criterios de aceptación**

- `GET /health` responde 200 y JSON.
- Si se añade `GET /ready`, debe ser idempotente y no devolver 500 en condiciones normales.

---

### 5) Documentación mínima de API para integración

**Alcance**

- Actualizar `README.md` (o añadir `doks/backend/API.md`) con:
  - Lista de endpoints por recurso (Auth, Users, Properties, Bookings, Reviews, Notifications, Favorites, Host).
  - Método, ruta, si requiere Bearer, body de ejemplo para POST/PATCH y respuesta 200/201 de ejemplo.
  - Códigos de error comunes (400, 401, 403, 404, 409) y formato `{ "error": { "code", "message" } }`.
- Objetivo: que un desarrollador frontend pueda integrar sin leer todo el código.

**Criterios de aceptación**

- Todos los endpoints públicos documentados con al menos método, URL y auth requerida.
- Al menos un ejemplo de request/response por recurso principal (auth, properties, bookings).

---

## 🧱 Estructura sugerida

- `tests/` o `src/__tests__/`
  - `health.test.ts`
  - `auth.test.ts`
  - `properties.test.ts` (opcional)
  - `stores/memoryProperties.test.ts` (opcional)
- `package.json`: script `"test": "..."`.

---

## ✅ Criterios de aceptación globales del Milestone 4

- `npm test` corre y pasa.
- Existen tests unitarios y al menos unos pocos de integración HTTP.
- `GET /health` (y opcionalmente `GET /ready`) documentado y estable.
- Documentación de API suficiente para que el frontend consuma Auth, Properties, Bookings, Users/me, Reviews, Notifications, Favorites y Host sin ambigüedad.
