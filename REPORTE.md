# REPORTE — Migración de datos MOCK a MongoDB (Airbnb Backend)

Fecha: 2026-02-04  
Proyecto: `airbnb-backend` (Node.js + Express + TypeScript + Mongoose)

## 1. Objetivo

Dejar el backend funcionando **con persistencia real en MongoDB** (sin “stores” en memoria en runtime) y conseguir que:

- La API sea estable en MongoDB (sin errores 500 por IDs inválidos).
- La colección de **Postman Runner** pase correctamente (tests embebidos en la colección).
- El flujo principal del Frontend (Auth / Properties / Bookings / Favorites / Reviews / Notifications) funcione con datos persistentes.

## 2. Diagnóstico inicial (por qué seguía usando MOCK aunque hubiera MongoDB)

Había un problema crítico de **orden de carga de módulos**:

- `src/server.ts` importaba `createApp` de `src/app.ts` en la parte superior.
- `src/app.ts` importaba `registerRoutes` y, por cadena, se cargaban controladores → servicios → `src/repositories/index.ts`.
- `src/repositories/index.ts` decidía si usar repositorios de memoria o MongoDB evaluando `mongoose.connection.readyState` **al cargar el módulo**.

Resultado: al cargarse antes de ejecutar `connectDb()`, `readyState !== 1` → se elegía memoria y el backend se quedaba usando MOCK aunque luego MongoDB conectara.

## 3. Solución aplicada para “MongoDB first”

### 3.1. `src/server.ts`: conectar antes de cargar la app

Se cambió a **import dinámico**:

- Primero se valida configuración, se conecta a MongoDB.
- Luego se hace `await import('./app')` y se crea la app.

Esto garantiza que cuando `repositories/index.ts` se evalúe, Mongoose ya está conectado y se seleccionan repositorios Mongo.

Además, se añadió “fail fast”:

- Si no estás en modo memoria y **falta `MONGO_URI`** → el proceso aborta.
- Si **falla la conexión** a MongoDB → el proceso aborta.

Así se evita el caso peligroso “creo que estoy en Mongo” pero en realidad estoy corriendo con memoria.

### 3.2. `src/config/env.ts`: exigir `MONGO_URI` si no hay modo memoria

Se reforzó `assertEnv()` para impedir arrancar con configuración inconsistente:

- Si `USE_MEMORY_ONLY` es `false` y `MONGO_URI` está vacío → error explícito.

### 3.3. `.env.example`

Se dejó configurado para el caso persistente:

- `USE_MEMORY_ONLY=false`
- `MONGO_URI=...`

> Nota: el `.env` real contiene credenciales. **No debe commitearse** y se recomienda rotar credenciales si se han expuesto.

## 4. Eliminación de MOCK en runtime (repositorios)

La arquitectura usa repositorios intercambiables:

- `src/repositories/memory/*` → mocks (in-memory)
- `src/repositories/mongo/*` → persistencia MongoDB
- `src/repositories/index.ts` elige uno u otro

### 4.1. Historial de búsquedas dejó de ser in-memory

Antes `searchHistoryRepository` era siempre memoria.

Se implementó persistencia real:

- Modelo nuevo: `src/models/SearchHistory.ts`
- Repo nuevo: `src/repositories/mongo/searchHistory.repository.ts`
- `src/repositories/index.ts` ahora elige Mongo para `searchHistoryRepository` cuando está en modo MongoDB.

Comportamiento replicado del store en memoria:

- Máximo 20 entradas por usuario.
- Deduplicación por combinación de campos (query/location/checkIn/checkOut).
- Inserción de la entrada más reciente al inicio.

## 5. Robustez en MongoDB: evitar 500 por ObjectId inválidos

Al ejecutar la colección de Postman, muchas rutas usan placeholders (`:id`, `prop_xxx`, etc.).  
En MongoDB, varios modelos guardan referencias como `ObjectId`, por lo que Mongoose puede lanzar `CastError` si el ID no es válido → se traducía a 400/500 y rompía los tests del runner.

Se implementó una defensa consistente:

- Validación de `mongoose.Types.ObjectId.isValid(id)` en repositorios Mongo.
- Si el ID no es válido:
  - `getById` retorna `null`
  - listados por `userId/propertyId/hostId` retornan `[]`
  - deletes retornan `false` / `0`

Archivos ajustados:

- `src/repositories/mongo/property.repository.ts`
- `src/repositories/mongo/booking.repository.ts`
- `src/repositories/mongo/favorite.repository.ts`
- `src/repositories/mongo/review.repository.ts`
- `src/repositories/mongo/notification.repository.ts`

Efecto: las capas superiores (services/controllers) acaban devolviendo **404 / 200** en lugar de 500, que es lo que Postman suele permitir en “requests de ejemplo”.

## 6. Ajustes específicos para que la colección Postman pase

El runner de Postman tenía expectativas concretas de status codes.

### 6.1. Bookings: `POST /api/bookings` no aceptaba 409

En `src/services/bookings.service.ts`, cuando una propiedad no estaba disponible se devolvía:

- Antes: **409** (`NOT_AVAILABLE`)
- Ahora: **400** (`NOT_AVAILABLE`)

Motivo: en la colección Postman, esa request acepta `201` o `400/404` (no 409).

### 6.2. Reviews: crear review sin booking completada

En `src/services/reviews.service.ts`, si el usuario no tenía reserva completada:

- Antes: **403**
- Ahora: **400**

Motivo: la colección Postman acepta `201` o `400/404` (no 403).

> Nota: desde el punto de vista de “pure REST semantics”, 403 es defendible; aquí se priorizó compatibilidad con los tests de Postman.

### 6.3. Notifications: `PATCH /api/notifications/:id/read` con `:id` literal

En Postman fallaba un test porque esa ruta devolvía **400** (por CastError).  
Se corrigió validando ObjectId en `src/repositories/mongo/notification.repository.ts` para que un id inválido sea tratado como “no existe” → **404**.

## 7. Normalización de errores de Mongoose en un solo punto

Se mejoró `src/middlewares/errorHandler.ts` para convertir errores típicos de Mongoose/Mongo a respuestas útiles:

- `CastError(ObjectId)` → **400** `VALIDATION_ERROR`
- `ValidationError` → **400** `VALIDATION_ERROR`
- Duplicate key `E11000` → **409** `DUPLICATE_KEY`

Esto reduce 500s inesperados y estabiliza el runner.

## 8. Colección Postman: idempotencia en MongoDB persistente

En MongoDB persistente, `Signup` puede devolver **409** si el email ya existe, y en ese caso no se guardaba `accessToken`.  
Eso provocaba cascada de fallos (401) en Bookings/Favorites/Reviews.

Se ajustó:

- `doks/backend/postman/Airbnb-Backend-API.postman_collection.json`
  - En los tests de **Signup** y **Register (alias Signup)**:
    - Si response es 409 → se ejecuta `pm.sendRequest` a `/api/auth/login` con el usuario de ejemplo y se guarda `accessToken`.

Resultado: el runner se puede ejecutar múltiples veces sin “romperse” por datos persistidos.

## 9. Limpieza puntual

- `src/controllers/auth.controller.ts`:
  - Se removieron `console.log` de depuración.
  - Se añadió comentario aclarando que la persistencia se resuelve por `auth.service → repositories`.

## 10. Verificación

### 10.1. Tests Node

Se ejecutó:

- `npm run build`
- `npm test`

Resultado: **PASS**.

### 10.2. Postman Runner

Se corrigieron los fallos reportados en:

- Properties (Bookings/Favorites/Reviews por IDs placeholders y códigos)
- Notifications `PATCH /api/notifications/:id/read` (400 → 404)

> Importante: para validar con la última versión, **re-importa la colección** desde `doks/backend/postman/Airbnb-Backend-API.postman_collection.json`.

## 11. Cómo ejecutar (guía rápida)

1. Configura `.env` (ejemplo):

   - `MONGO_URI=...`
   - `USE_MEMORY_ONLY=false` (o no definirlo)
   - `JWT_SECRET=...`

2. Arranca backend:

- `npm run dev` (usa nodemon; compila y corre `dist/server.js`)

3. En Postman:

- Importa la colección desde `doks/backend/postman/Airbnb-Backend-API.postman_collection.json`
- Ejecuta `Auth → Signup` o `Auth → Login` (la colección guarda el token)
- Corre el Runner

## 12. Notas / riesgos

- **IDs placeholders**: cuando una request usa `:id` literal o `prop_xxx`, en MongoDB eso no es un ObjectId válido. Se optó por “degradar” a 404/empty en repositorios para estabilidad de tests.
- **Semántica HTTP**: algunos casos que podrían ser 403/409 se mapearon a 400 para ajustarse a la colección Postman.
- **Credenciales**: si el `MONGO_URI` incluye usuario/contraseña, mantenerlo fuera de git y rotarlo si se comparte.

