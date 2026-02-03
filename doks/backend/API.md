# API REST — Documentación para integración (Mocks 100%)

**Documentación ampliada con ejemplos y colección Postman:** [API-REFERENCE.md](./API-REFERENCE.md) · Postman: [postman/Airbnb-Backend-API.postman_collection.json](./postman/Airbnb-Backend-API.postman_collection.json)

Base URL: `http://localhost:3333` (o la configurada en `PORT`).

Formato de errores: `{ "error": { "code": "CODIGO", "message": "..." } }`.  
Códigos comunes: `400` (validación), `401` (no autenticado), `403` (no autorizado), `404` (no encontrado), `409` (conflicto).

---

## Health e info

| Método | Ruta     | Auth | Descripción        |
|--------|----------|------|--------------------|
| GET    | /health  | No   | Liveness. Responde `{ "ok": true }`. |
| GET    | /ready   | No   | Readiness. Responde `{ "ok": true, "ready": true }`. |
| GET    | /api/info | No  | Información de la API. 200: `{ "version", "memoryOnly", "env" }`. (M7) |

---

## Dev (solo con USE_MEMORY_ONLY o NODE_ENV=development)

| Método | Ruta            | Auth | Descripción |
|--------|------------------|------|-------------|
| POST   | /api/dev/seed    | No   | Resetea stores in-memory y crea datos de ejemplo (usuarios, propiedades, reservas). 200: `{ "ok": true, "users", "propertiesCount", "bookingsCount" }`. En producción sin modo memoria: 404. (M7) |

---

## Auth

| Método | Ruta                         | Auth | Descripción |
|--------|------------------------------|------|-------------|
| POST   | /api/auth/signup             | No   | Registro. Body: `{ "fullName", "email", "password" }`. 201: `{ "user", "accessToken" }`. 409: EMAIL_IN_USE. |
| POST   | /api/auth/register           | No   | Alias de signup. |
| POST   | /api/auth/login              | No   | Login. Body: `{ "email", "password" }`. 200: `{ "user", "accessToken" }`. |
| GET    | /api/auth/me                 | Bearer | Usuario actual. 200: `{ "user" }`. |
| GET    | /api/auth/verify             | Bearer | Alias de me. |
| POST   | /api/auth/logout             | Bearer | Cierra sesión (stateless). 200: `{ "ok": true }`. |
| POST   | /api/auth/forgot-password    | No   | Body: `{ "email" }`. 200 (dev): `{ "ok": true, "resetToken", "expiresAt" }`. |
| GET    | /api/auth/reset-password/validate?token= | No | Valida token. 200: `{ "ok": true }`. 400: INVALID_TOKEN. |
| POST   | /api/auth/reset-password     | No   | Body: `{ "token", "password" }`. 200: `{ "ok": true }`. |

---

## Users (perfil)

| Método | Ruta            | Auth   | Descripción |
|--------|-----------------|--------|-------------|
| GET    | /api/users/me   | Bearer | Perfil + stats. 200: `{ "user", "stats": { "propertiesCount", "bookingsCount" } }`. |
| PATCH  | /api/users/me  | Bearer | Actualizar perfil. Body: `{ "fullName"?, "email"?, "avatarUrl"? }`. |
| DELETE | /api/users/me  | Bearer | Eliminar cuenta. 200: `{ "ok": true }`. |

---

## Properties

| Método | Ruta                              | Auth   | Descripción |
|--------|-----------------------------------|--------|-------------|
| GET    | /api/properties                   | No     | Catálogo. Query: `q`, `location`, `minPrice`, `maxPrice`, `amenities` (CSV), `minRating`, `checkIn`, `checkOut`, `page`, `limit`, `sort` (price_asc, price_desc, rating_desc, newest, relevance). 200: `{ "items", "page", "limit", "total" }`. |
| GET    | /api/properties/mine              | Bearer | Mis propiedades (host). |
| GET    | /api/properties/:id               | No     | Detalle. 404: PROPERTY_NOT_FOUND. |
| GET    | /api/properties/:id/availability  | No     | Query: `checkIn`, `checkOut`. 200: `{ "available": boolean }`. |
| GET    | /api/properties/:id/booking-preview | No   | Query: `checkIn`, `checkOut`, `guests`. 200: `{ "available", "pricePerNight", "nights", "totalPrice" }`. 400: GUESTS_EXCEED_MAX. |
| GET    | /api/properties/:id/reviews       | No     | 200: `{ "items", "averageRating", "total" }`. |
| POST   | /api/properties                   | Bearer | Crear. Body: title, description, location, pricePerNight, images[], amenities[], propertyType?, bedrooms?, bathrooms?, maxGuests?. 201: propiedad creada. |
| POST   | /api/properties/:id/reviews       | Bearer | Crear review (requiere reserva completada). Body: `{ "rating", "comment" }`. 409: REVIEW_ALREADY_EXISTS. |
| PATCH  | /api/properties/:id               | Bearer | Actualizar (solo dueño). 403: FORBIDDEN. |
| DELETE | /api/properties/:id               | Bearer | Eliminar (solo dueño). 204. |

---

## Bookings

| Método | Ruta                 | Auth   | Descripción |
|--------|----------------------|--------|-------------|
| GET    | /api/bookings        | Bearer | Mis reservas. 200: `{ "items" }`. |
| GET    | /api/bookings/:id    | Bearer | Detalle. Query: `include=property` para incluir propiedad. 403 si no es tu reserva. |
| POST   | /api/bookings        | Bearer | Crear. Body: `{ "propertyId", "checkIn", "checkOut", "guests" }`. 201: reserva. 409: NOT_AVAILABLE. 400: GUESTS_EXCEED_MAX. |
| PATCH  | /api/bookings/:id    | Bearer | Cancelar. Body: `{ "status": "cancelled" }`. |

---

## Reviews

| Método | Ruta               | Auth   | Descripción |
|--------|--------------------|--------|-------------|
| PATCH  | /api/reviews/:id   | Bearer | Editar (solo autor). Body: `{ "rating"?, "comment"? }`. |
| DELETE | /api/reviews/:id   | Bearer | Borrar (solo autor). 200: `{ "ok": true }`. |

---

## Favorites

| Método | Ruta                      | Auth   | Descripción |
|--------|---------------------------|--------|-------------|
| GET    | /api/favorites            | Bearer | Lista favoritos. 200: `{ "items" }`. |
| POST   | /api/favorites            | Bearer | Añadir. Body: `{ "propertyId" }`. Idempotente. 404: PROPERTY_NOT_FOUND. |
| GET    | /api/favorites/:propertyId| Bearer | 200: `{ "favorite": boolean }`. |
| DELETE | /api/favorites/:propertyId| Bearer | Quitar favorito. |

---

## Notifications

| Método | Ruta                            | Auth   | Descripción |
|--------|----------------------------------|--------|-------------|
| GET    | /api/notifications              | Bearer | Lista. 200: `{ "items" }`. |
| GET    | /api/notifications/unread-count | Bearer | 200: `{ "unread": number }`. |
| POST   | /api/notifications              | Bearer | Crear notificación (mock). Body: `{ "type"?, "title"?, "message"?, "link"? }`. 201. |
| POST   | /api/notifications/read-all     | Bearer | Marcar todas leídas. 200: `{ "ok": true, "count" }`. |
| PATCH  | /api/notifications/:id/read     | Bearer | Marcar una leída. 200: notificación. |

---

## Host (dashboard)

| Método | Ruta                 | Auth   | Descripción |
|--------|----------------------|--------|-------------|
| GET    | /api/host/dashboard   | Bearer | Stats + recentBookings, recentReviews, notifications. 200: `{ "stats", "recentBookings", "recentReviews", "notifications" }`. |

---

## Search (M5)

| Método | Ruta                 | Auth   | Descripción |
|--------|----------------------|--------|-------------|
| GET    | /api/search/suggestions | No   | Query: `q`. 200: `{ "suggestions": string[] }` (ubicaciones). |
| GET    | /api/search/history   | Bearer | Últimas búsquedas del usuario. |
| POST   | /api/search/history   | Bearer | Guardar búsqueda (body con q, location, checkIn, checkOut, etc.). |
| DELETE | /api/search/history   | Bearer | Vaciar historial. |

---

## Flujo checkout (M6)

1. `GET /api/properties/:id` — datos de la propiedad.
2. `GET /api/properties/:id/booking-preview?checkIn=&checkOut=&guests=` — disponibilidad y precio.
3. Usuario confirma → `POST /api/bookings` con `propertyId`, `checkIn`, `checkOut`, `guests`.
4. Redirigir a detalle → `GET /api/bookings/:id` (opcional `?include=property`).

Errores: `409 NOT_AVAILABLE`, `400 GUESTS_EXCEED_MAX`, `404 PROPERTY_NOT_FOUND`.
