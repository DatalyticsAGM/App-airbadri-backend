# 🎯 Milestone 2 (Backend): Propiedades + Reservas (API REST)

## 📋 Fuente de verdad

- Frontend: `doks/frontend/MILESTONE_2.md`
- Reglas: `.cursor/rules/No-dependencias.mdc` (dependencias mínimas; preferir Node/TS nativo; evitar sobreingeniería)

## 🎯 Objetivo

Exponer una **API REST mínima** para soportar el Milestone 2 del Frontend:
- Catálogo y detalle de **propiedades (listings)**
- **CRUD** de propiedades para el host (usuario autenticado)
- **Reservas (bookings)** con validación de disponibilidad (fechas) y cancelación
- **Perfil** del usuario autenticado (lectura/actualización básica) + estadísticas simples

## ✅ Principios / restricciones (importantes)

- **Sin dependencias nuevas** salvo necesidad real (ideal: ninguna).
- Persistencia **memory-first** (in-memory) para desarrollo; MongoDB **solo si** `MONGO_URI` está configurada (alineado con el backend actual).
- Código simple (MVC claro, funciones, sin abstracciones avanzadas).
- Respuestas de error consistentes con el backend actual:
  - `{"error": {"code": "SOME_CODE", "message": "..."}}`

---

## 🧩 Milestone 2 — Tareas (máximo 5)

### 1) Dominio `properties`: modelo + store + validaciones mínimas
**Alcance**
- Definir la entidad `Property` (campos necesarios para la UI de catálogo/detalle/creación/edición).
- Implementar store **in-memory** (`memoryProperties`) con operaciones:
  - `list/search`, `getById`, `listByHost`, `create`, `update`, `remove`
- (Opcional) Modelo MongoDB `Property` si DB está conectada, manteniendo misma interfaz de servicio.

**Criterios de aceptación**
- Se puede crear/leer/editar/eliminar una propiedad sin MongoDB (modo memoria).
- Campos mínimos validados (ej.: `title`, `location`, `pricePerNight`, `images[]`, `amenities[]`).

---

### 2) API REST `properties` (catálogo, detalle, mis propiedades, CRUD)
**Alcance**
- Endpoints REST y controladores para:
  - Catálogo público con filtros
  - Detalle público
  - CRUD protegido (requiere auth)
  - Ownership: solo el host dueño puede editar/eliminar

**Criterios de aceptación**
- `GET /api/properties` retorna lista paginable/limitada (aunque sea simple).
- `GET /api/properties/:id` retorna 404 si no existe.
- `POST/PATCH/DELETE` requieren `Authorization: Bearer ...`.
- `PATCH/DELETE` responden 403 si no es dueño.

---

### 3) Dominio `bookings`: disponibilidad (solapamiento de fechas) + totales + estados
**Alcance**
- Definir `Booking` + `BookingStatus` (mínimo: `pending`, `confirmed`, `cancelled`, `completed`).
- Implementar store **in-memory** (`memoryBookings`) con operaciones:
  - `create`, `getById`, `listByUser`, `listByProperty`, `updateStatus/cancel`
- Implementar validación de disponibilidad:
  - No permitir reservar si hay solapamiento con reservas activas (no `cancelled`).
- Calcular `totalPrice` de forma simple:
  - `nights = differenceInDays(checkOut, checkIn)` (sin librerías; con Date nativa) y `totalPrice = nights * pricePerNight`.

**Criterios de aceptación**
- No permite reservas con `checkIn >= checkOut`.
- No permite reservar si las fechas se solapan con otra reserva activa.

---

### 4) API REST `bookings` (crear, listar, detalle, cancelar)
**Alcance**
- Endpoints protegidos para:
  - Crear reserva
  - Listar reservas del usuario autenticado
  - Ver detalle de una reserva propia
  - Cancelar reserva propia

**Criterios de aceptación**
- `POST /api/bookings` valida propiedad existente y disponibilidad.
- `GET /api/bookings` solo devuelve reservas del usuario.
- `GET /api/bookings/:id` devuelve 403 si no pertenece al usuario.
- `PATCH /api/bookings/:id` permite cancelar (cambiar `status` a `cancelled`) si corresponde.

---

### 5) API REST `users/me` (perfil + stats mínimas)
**Alcance**
- Endpoint protegido para perfil:
  - Leer perfil actual
  - Actualizar campos básicos (ej. `fullName`, `avatarUrl` si aplica)
- “Stats” simples para la UI del perfil:
  - `propertiesCount`, `bookingsCount` (puede venir embebido en `GET /me` para evitar otro endpoint).

**Criterios de aceptación**
- `GET /api/users/me` requiere auth y devuelve datos del usuario + stats.
- `PATCH /api/users/me` valida inputs (no permite email vacío, etc.).

---

## 🧱 Estructura de carpetas sugerida (backend)

Manteniendo el estilo actual en `src/`:

- `src/routes/`
  - `auth.routes.ts` (existe)
  - `properties.routes.ts`
  - `bookings.routes.ts`
  - `users.routes.ts`
  - `index.ts` (registrar nuevas rutas)
- `src/controllers/`
  - `properties.controller.ts`
  - `bookings.controller.ts`
  - `users.controller.ts`
- `src/services/`
  - `properties.service.ts`
  - `bookings.service.ts`
  - `users.service.ts` (o extender auth si conviene, sin mezclar responsabilidades)
- `src/store/`
  - `memoryProperties.ts`
  - `memoryBookings.ts`
- `src/models/` (solo si Mongo está conectado)
  - `Property.ts`
  - `Booking.ts`
- `src/utils/`
  - `validation.ts` (extender)

---

## 🔌 Endpoints propuestos (contratos simples)

### Auth (ya existente)
- `POST /api/auth/signup` (o `/register`)
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer)

---

### Properties

#### `GET /api/properties`
**Query (opcionales)**
- `location` (string)
- `minPrice` (number)
- `maxPrice` (number)
- `amenities` (csv: `wifi,kitchen`)
- `hostId` (string, opcional; normalmente usar `/mine`)
- `page`, `limit` (opcionales)

**200**
```json
{
  "items": [{ "id": "p1", "title": "…", "location": "…", "pricePerNight": 120, "images": [], "amenities": [], "hostId": "u1" }],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

#### `GET /api/properties/:id`
**200**
```json
{ "id": "p1", "title": "…", "description": "…", "location": "…", "pricePerNight": 120, "images": [], "amenities": [], "hostId": "u1" }
```
**404**
```json
{ "error": { "code": "PROPERTY_NOT_FOUND", "message": "Property not found" } }
```

#### `GET /api/properties/mine` (Bearer)
Lista propiedades del host autenticado.

#### `POST /api/properties` (Bearer)
**Body**
```json
{ "title": "…", "description": "…", "location": "…", "pricePerNight": 120, "images": ["…"], "amenities": ["wifi"] }
```
**201** devuelve la propiedad creada (con `hostId` del token).

#### `PATCH /api/properties/:id` (Bearer, ownership)
Actualiza campos permitidos.

#### `DELETE /api/properties/:id` (Bearer, ownership)
**204** (o 200 con `{ ok: true }`, pero preferible 204).

---

### Bookings

#### `GET /api/properties/:id/availability`
**Query**: `checkIn`, `checkOut` (ISO string)
**200**
```json
{ "available": true }
```

#### `POST /api/bookings` (Bearer)
**Body**
```json
{ "propertyId": "p1", "checkIn": "2026-02-01", "checkOut": "2026-02-05", "guests": 2 }
```
**201**
```json
{ "id": "b1", "propertyId": "p1", "userId": "u2", "checkIn": "2026-02-01", "checkOut": "2026-02-05", "guests": 2, "totalPrice": 480, "status": "confirmed" }
```
**409 (no disponible)**
```json
{ "error": { "code": "NOT_AVAILABLE", "message": "Property is not available for selected dates" } }
```

#### `GET /api/bookings` (Bearer)
Lista “Mis reservas”.

#### `GET /api/bookings/:id` (Bearer)
Devuelve detalle solo si la reserva pertenece al usuario.

#### `PATCH /api/bookings/:id` (Bearer)
Uso mínimo para cancelación:
```json
{ "status": "cancelled" }
```

---

### Users (perfil)

#### `GET /api/users/me` (Bearer)
**200**
```json
{
  "user": { "id": "u1", "fullName": "…", "email": "…" },
  "stats": { "propertiesCount": 3, "bookingsCount": 5 }
}
```

#### `PATCH /api/users/me` (Bearer)
**Body (ejemplo)**
```json
{ "fullName": "Nuevo Nombre", "avatarUrl": "https://..." }
```

---

## 🗺️ Mapeo: pantallas del Frontend → endpoints backend

> Referencia: `doks/frontend/MILESTONE_2.md`

- **Catálogo** `app/properties/page.tsx`
  - `GET /api/properties` (filtros + paginación simple)
- **Detalle** `app/properties/[id]/page.tsx`
  - `GET /api/properties/:id`
  - `GET /api/properties/:id/availability` (para validar fechas antes de reservar; opcional si el frontend ya valida al crear)
- **Crear propiedad** `app/properties/create/page.tsx`
  - `POST /api/properties` (Bearer)
- **Editar propiedad** `app/properties/[id]/edit/page.tsx`
  - `GET /api/properties/:id` (prefill)
  - `PATCH /api/properties/:id` (Bearer + ownership)
- **Mis propiedades** `app/properties/my-properties/page.tsx`
  - `GET /api/properties/mine` (Bearer)
  - `DELETE /api/properties/:id` (Bearer + ownership)
- **Mis reservas** `app/bookings/page.tsx`
  - `GET /api/bookings` (Bearer)
  - `PATCH /api/bookings/:id` (Bearer) para cancelar
- **Detalle reserva** `app/bookings/[id]/page.tsx`
  - `GET /api/bookings/:id` (Bearer)
- **Perfil** `app/profile/page.tsx`
  - `GET /api/users/me` (Bearer)
  - `PATCH /api/users/me` (Bearer)

