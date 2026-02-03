# API REST — Referencia completa con ejemplos

Documentación ampliada de todos los endpoints del backend Airbnb (Milestone 1–7). Para importar en Postman usa la colección en `doks/backend/postman/Airbnb-Backend-API.postman_collection.json`.

---

## Convenciones

### Base URL

- Desarrollo: `http://localhost:3333` (o el valor de `PORT` en `.env`).

### Autenticación (Bearer)

- Endpoints marcados con **Auth: Bearer** requieren cabecera:
  - `Authorization: Bearer <accessToken>`
- El token se obtiene con `POST /api/auth/login` o `POST /api/auth/signup` en el campo `accessToken`.

### Formato de errores

Todas las respuestas de error usan:

```json
{
  "error": {
    "code": "CODIGO",
    "message": "Descripción legible"
  }
}
```

| Código HTTP | Uso típico | error.code ejemplos |
|-------------|------------|---------------------|
| 400 | Validación, parámetros inválidos | VALIDATION_ERROR, INVALID_TOKEN |
| 401 | No autenticado o token inválido | UNAUTHORIZED, INVALID_CREDENTIALS |
| 403 | No autorizado (recurso ajeno) | FORBIDDEN |
| 404 | Recurso no encontrado | NOT_FOUND, PROPERTY_NOT_FOUND, NOTIFICATION_NOT_FOUND |
| 409 | Conflicto (ej. email en uso) | EMAIL_IN_USE, NOT_AVAILABLE, REVIEW_ALREADY_EXISTS |

### Content-Type

- Peticiones con body: `Content-Type: application/json`.

---

## Índice de endpoints

| Recurso | Método | Ruta | Auth |
|---------|--------|------|------|
| Raíz | GET | `/` | No |
| Info | GET | `/api/info` | No |
| Health | GET | `/health` | No |
| Ready | GET | `/ready` | No |
| Dev | POST | `/api/dev/seed` | No |
| Auth | POST | `/api/auth/signup` | No |
| Auth | POST | `/api/auth/register` | No |
| Auth | POST | `/api/auth/login` | No |
| Auth | GET | `/api/auth/me` | Bearer |
| Auth | GET | `/api/auth/verify` | Bearer |
| Auth | POST | `/api/auth/logout` | Bearer |
| Auth | POST | `/api/auth/forgot-password` | No |
| Auth | GET | `/api/auth/reset-password/validate` | No |
| Auth | POST | `/api/auth/reset-password` | No |
| Users | GET | `/api/users/me` | Bearer |
| Users | PATCH | `/api/users/me` | Bearer |
| Users | DELETE | `/api/users/me` | Bearer |
| Properties | GET | `/api/properties` | No |
| Properties | GET | `/api/properties/mine` | Bearer |
| Properties | GET | `/api/properties/:id` | No |
| Properties | GET | `/api/properties/:id/availability` | No |
| Properties | GET | `/api/properties/:id/booking-preview` | No |
| Properties | GET | `/api/properties/:id/reviews` | No |
| Properties | POST | `/api/properties` | Bearer |
| Properties | POST | `/api/properties/:id/reviews` | Bearer |
| Properties | PATCH | `/api/properties/:id` | Bearer |
| Properties | DELETE | `/api/properties/:id` | Bearer |
| Bookings | GET | `/api/bookings` | Bearer |
| Bookings | GET | `/api/bookings/:id` | Bearer |
| Bookings | POST | `/api/bookings` | Bearer |
| Bookings | PATCH | `/api/bookings/:id` | Bearer |
| Reviews | PATCH | `/api/reviews/:id` | Bearer |
| Reviews | DELETE | `/api/reviews/:id` | Bearer |
| Favorites | GET | `/api/favorites` | Bearer |
| Favorites | POST | `/api/favorites` | Bearer |
| Favorites | GET | `/api/favorites/:propertyId` | Bearer |
| Favorites | DELETE | `/api/favorites/:propertyId` | Bearer |
| Notifications | GET | `/api/notifications` | Bearer |
| Notifications | GET | `/api/notifications/unread-count` | Bearer |
| Notifications | POST | `/api/notifications` | Bearer |
| Notifications | POST | `/api/notifications/read-all` | Bearer |
| Notifications | PATCH | `/api/notifications/:id/read` | Bearer |
| Host | GET | `/api/host/dashboard` | Bearer |
| Search | GET | `/api/search/suggestions` | No |
| Search | GET | `/api/search/history` | Bearer |
| Search | POST | `/api/search/history` | Bearer |
| Search | DELETE | `/api/search/history` | Bearer |

---

## 1. Raíz, health e info

### GET /

Resumen de la API (sin auth).

**Response 200**

```json
{
  "message": "🚀 Airbnb Backend API funcionando",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "properties": "/api/properties",
    "bookings": "/api/bookings",
    "reviews": "/api/reviews",
    "notifications": "/api/notifications",
    "favorites": "/api/favorites",
    "host": "/api/host",
    "register": "POST /api/auth/register",
    "login": "POST /api/auth/login",
    "forgotPassword": "POST /api/auth/forgot-password",
    "resetPassword": "POST /api/auth/reset-password",
    "verify": "GET /api/auth/verify"
  }
}
```

### GET /health

Liveness. **Response 200:** `{ "ok": true }`

### GET /ready

Readiness. **Response 200:** `{ "ok": true, "ready": true }`

### GET /api/info

Información de versión y modo.

**Response 200**

```json
{
  "version": "1.0.0",
  "memoryOnly": true,
  "env": "development"
}
```

---

## 2. Dev (solo con USE_MEMORY_ONLY o NODE_ENV=development)

### POST /api/dev/seed

Resetea los stores in-memory y crea datos de ejemplo (usuarios, propiedades, reservas). En producción sin modo memoria responde 404.

**Response 200**

```json
{
  "ok": true,
  "users": 3,
  "propertiesCount": 5,
  "bookingsCount": 4
}
```

**Ejemplo**

```bash
curl -X POST http://localhost:3333/api/dev/seed
```

---

## 3. Auth

### POST /api/auth/signup — Registro

**Body (JSON)**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| fullName | string | Sí | Nombre completo |
| email | string | Sí | Email válido |
| password | string | Sí | Mínimo 6 caracteres |

**Response 201**

```json
{
  "user": {
    "id": "usr_xxx",
    "fullName": "María García",
    "email": "maria@example.com",
    "avatarUrl": null
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errores:** 400 (VALIDATION_ERROR), 409 (EMAIL_IN_USE)

**Ejemplo**

```bash
curl -X POST http://localhost:3333/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"María García","email":"maria@example.com","password":"secret123"}'
```

### POST /api/auth/register

Alias de `signup`. Mismo body y respuesta.

### POST /api/auth/login — Login

**Body (JSON)**

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| email | string | Sí |
| password | string | Sí |

**Response 200**

```json
{
  "user": {
    "id": "usr_xxx",
    "fullName": "María García",
    "email": "maria@example.com",
    "avatarUrl": null
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errores:** 400 (VALIDATION_ERROR), 401 (INVALID_CREDENTIALS)

**Ejemplo**

```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","password":"secret123"}'
```

### GET /api/auth/me — Usuario actual

**Auth:** Bearer

**Response 200**

```json
{
  "user": {
    "id": "usr_xxx",
    "fullName": "María García",
    "email": "maria@example.com",
    "avatarUrl": null
  }
}
```

### GET /api/auth/verify

Alias de `me`. Mismo uso (Bearer) y respuesta.

### POST /api/auth/logout

**Auth:** Bearer. Stateless: el cliente debe borrar el token.

**Response 200:** `{ "ok": true }`

### POST /api/auth/forgot-password

**Body (JSON)**

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| email | string | Sí |

Siempre responde 200 por seguridad (aunque el email no exista). En desarrollo incluye el token para pruebas.

**Response 200**

```json
{
  "ok": true,
  "resetToken": "abc123...",
  "expiresAt": "2025-02-03T12:30:00.000Z"
}
```

### GET /api/auth/reset-password/validate

**Query**

| Parámetro | Tipo | Obligatorio |
|-----------|------|-------------|
| token | string | Sí |

**Response 200**

```json
{
  "ok": true,
  "expiresAt": "2025-02-03T12:30:00.000Z"
}
```

**Errores:** 400 (VALIDATION_ERROR, INVALID_TOKEN)

### POST /api/auth/reset-password

**Body (JSON)**

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| token | string | Sí |
| password | string | Sí (mín. 6 caracteres) |

**Response 200:** `{ "ok": true }`

**Errores:** 400 (VALIDATION_ERROR, INVALID_TOKEN)

---

## 4. Users (perfil)

### GET /api/users/me

**Auth:** Bearer. Devuelve perfil y estadísticas.

**Response 200**

```json
{
  "user": {
    "id": "usr_xxx",
    "fullName": "María García",
    "email": "maria@example.com",
    "avatarUrl": null
  },
  "stats": {
    "propertiesCount": 2,
    "bookingsCount": 1
  }
}
```

### PATCH /api/users/me

**Auth:** Bearer. Actualizar perfil. Al menos un campo obligatorio.

**Body (JSON)** — todos opcionales pero al menos uno requerido

| Campo | Tipo | Descripción |
|-------|------|-------------|
| fullName | string | Nombre completo |
| email | string | Email (debe ser único) |
| avatarUrl | string | URL del avatar |

**Response 200**

```json
{
  "user": {
    "id": "usr_xxx",
    "fullName": "María García",
    "email": "nuevo@example.com",
    "avatarUrl": "https://..."
  }
}
```

**Errores:** 400 (VALIDATION_ERROR), 409 (EMAIL_IN_USE)

### DELETE /api/users/me

**Auth:** Bearer. Elimina la cuenta del usuario actual.

**Response 200:** `{ "ok": true }`

---

## 5. Properties

### GET /api/properties — Catálogo

**Query params**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| q | string | Búsqueda por texto |
| location | string | Filtrar por ubicación |
| minPrice | number | Precio mínimo por noche |
| maxPrice | number | Precio máximo por noche |
| amenities | string | CSV, ej. `wifi,parking` |
| hostId | string | Filtrar por anfitrión |
| minRating | number | Rating mínimo |
| checkIn | string | Fecha check-in (YYYY-MM-DD) |
| checkOut | string | Fecha check-out (YYYY-MM-DD) |
| page | number | Página (paginación) |
| limit | number | Items por página |
| sort | string | price_asc, price_desc, rating_desc, newest, relevance |

**Response 200**

```json
{
  "items": [
    {
      "id": "prop_xxx",
      "hostId": "usr_xxx",
      "title": "Casa con vista al mar",
      "description": "...",
      "location": "Barcelona",
      "pricePerNight": 85,
      "images": ["https://..."],
      "amenities": ["wifi", "parking"],
      "propertyType": "house",
      "bedrooms": 2,
      "bathrooms": 1,
      "maxGuests": 4,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 42
}
```

**Ejemplo**

```bash
curl "http://localhost:3333/api/properties?location=Barcelona&minPrice=50&maxPrice=150&page=1&limit=10"
```

### GET /api/properties/mine

**Auth:** Bearer. Lista las propiedades del host actual.

**Response 200**

```json
{
  "items": [
    {
      "id": "prop_xxx",
      "hostId": "usr_xxx",
      "title": "Mi apartamento",
      "location": "Madrid",
      "pricePerNight": 60,
      "images": [],
      "amenities": [],
      "createdAt": "..."
    }
  ]
}
```

### GET /api/properties/:id — Detalle

**Response 200:** Objeto propiedad completo.

**Errores:** 404 (PROPERTY_NOT_FOUND)

### GET /api/properties/:id/availability

**Query**

| Parámetro | Tipo | Obligatorio |
|-----------|------|-------------|
| checkIn | string | Sí (YYYY-MM-DD) |
| checkOut | string | Sí (YYYY-MM-DD) |

**Response 200**

```json
{
  "available": true
}
```

**Errores:** 400 (VALIDATION_ERROR), 404 (PROPERTY_NOT_FOUND)

### GET /api/properties/:id/booking-preview

**Query**

| Parámetro | Tipo | Obligatorio |
|-----------|------|-------------|
| checkIn | string | Sí (YYYY-MM-DD) |
| checkOut | string | Sí (YYYY-MM-DD) |
| guests | number | No (default 1) |

**Response 200**

```json
{
  "available": true,
  "pricePerNight": 85,
  "nights": 3,
  "totalPrice": 255
}
```

**Errores:** 400 (VALIDATION_ERROR, GUESTS_EXCEED_MAX), 404 (PROPERTY_NOT_FOUND)

### GET /api/properties/:id/reviews

**Response 200**

```json
{
  "items": [
    {
      "id": "rev_xxx",
      "propertyId": "prop_xxx",
      "userId": "usr_xxx",
      "rating": 5,
      "comment": "Excelente estancia.",
      "createdAt": "2025-01-15T00:00:00.000Z"
    }
  ],
  "averageRating": 4.5,
  "total": 1
}
```

**Errores:** 404 (PROPERTY_NOT_FOUND)

### POST /api/properties — Crear propiedad

**Auth:** Bearer.

**Body (JSON)**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| title | string | Sí | Título |
| description | string | Sí | Descripción |
| location | string | Sí | Ubicación |
| pricePerNight | number | Sí | Precio por noche |
| images | string[] | No | URLs de imágenes |
| amenities | string[] | No | Ej. ["wifi","parking"] |
| propertyType | string | No | house, apartment, etc. |
| bedrooms | number | No | |
| bathrooms | number | No | |
| maxGuests | number | No | |

**Response 201:** Objeto propiedad creada (con `id`, `hostId`, etc.)

**Ejemplo**

```json
{
  "title": "Apartamento céntrico",
  "description": "Muy luminoso, cerca del metro.",
  "location": "Madrid",
  "pricePerNight": 70,
  "images": ["https://example.com/1.jpg"],
  "amenities": ["wifi", "kitchen"],
  "maxGuests": 4
}
```

### POST /api/properties/:id/reviews — Crear review

**Auth:** Bearer. Requiere reserva completada en esa propiedad.

**Body (JSON)**

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| rating | number | Sí (1–5) |
| comment | string | Sí |
| ratingDetails | object | No |

**Response 201:** Objeto review creado.

**Errores:** 400 (VALIDATION_ERROR), 403 (FORBIDDEN), 404 (PROPERTY_NOT_FOUND), 409 (REVIEW_ALREADY_EXISTS)

### PATCH /api/properties/:id

**Auth:** Bearer. Solo el dueño. Body: campos a actualizar (title, description, location, pricePerNight, images, amenities, etc.).

**Response 200:** Propiedad actualizada.

**Errores:** 403 (FORBIDDEN), 404 (PROPERTY_NOT_FOUND)

### DELETE /api/properties/:id

**Auth:** Bearer. Solo el dueño.

**Response 204:** Sin cuerpo.

**Errores:** 403 (FORBIDDEN), 404 (PROPERTY_NOT_FOUND)

---

## 6. Bookings

### GET /api/bookings

**Auth:** Bearer. Lista las reservas del usuario.

**Response 200**

```json
{
  "items": [
    {
      "id": "book_xxx",
      "propertyId": "prop_xxx",
      "userId": "usr_xxx",
      "checkIn": "2025-02-10",
      "checkOut": "2025-02-13",
      "guests": 2,
      "totalPrice": 255,
      "status": "confirmed",
      "createdAt": "2025-01-20T00:00:00.000Z"
    }
  ]
}
```

### GET /api/bookings/:id

**Auth:** Bearer. Detalle de una reserva (solo si es del usuario).

**Query**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| include | string | `property` para incluir datos de la propiedad |

**Response 200:** Objeto reserva (y opcionalmente `property`).

**Errores:** 403 (no es tu reserva), 404

### POST /api/bookings — Crear reserva

**Auth:** Bearer.

**Body (JSON)**

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| propertyId | string | Sí |
| checkIn | string | Sí (YYYY-MM-DD) |
| checkOut | string | Sí (YYYY-MM-DD) |
| guests | number | Sí |

**Response 201:** Reserva creada (con `id`, `status`, `totalPrice`, etc.)

**Errores:** 400 (VALIDATION_ERROR, GUESTS_EXCEED_MAX), 404 (PROPERTY_NOT_FOUND), 409 (NOT_AVAILABLE)

**Ejemplo**

```json
{
  "propertyId": "prop_xxx",
  "checkIn": "2025-02-10",
  "checkOut": "2025-02-13",
  "guests": 2
}
```

### PATCH /api/bookings/:id — Cancelar

**Auth:** Bearer. Solo cancelación.

**Body (JSON)**

```json
{
  "status": "cancelled"
}
```

**Response 200:** Reserva actualizada (status: cancelled).

**Errores:** 400 (solo status=cancelled permitido), 403, 404

---

## 7. Reviews (edición/borrado)

Las reviews se crean en `POST /api/properties/:id/reviews`. Aquí solo edición y borrado por ID de review.

### PATCH /api/reviews/:id

**Auth:** Bearer. Solo el autor de la review.

**Body (JSON)** — opcionales

| Campo | Tipo |
|-------|------|
| rating | number (1–5) |
| comment | string |

**Response 200:** Review actualizada.

**Errores:** 403 (FORBIDDEN), 404

### DELETE /api/reviews/:id

**Auth:** Bearer. Solo el autor.

**Response 200:** `{ "ok": true }`

---

## 8. Favorites

### GET /api/favorites

**Auth:** Bearer.

**Response 200**

```json
{
  "items": [
    {
      "id": "fav_xxx",
      "userId": "usr_xxx",
      "propertyId": "prop_xxx",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/favorites — Añadir favorito

**Auth:** Bearer. Idempotente (si ya existe, devuelve el mismo).

**Body (JSON)**

```json
{
  "propertyId": "prop_xxx"
}
```

**Response 201:** Objeto favorito creado.

**Errores:** 400 (VALIDATION_ERROR), 404 (PROPERTY_NOT_FOUND)

### GET /api/favorites/:propertyId

**Auth:** Bearer.

**Response 200**

```json
{
  "favorite": true
}
```

### DELETE /api/favorites/:propertyId

**Auth:** Bearer.

**Response 200:** `{ "ok": true }`

---

## 9. Notifications

### GET /api/notifications

**Auth:** Bearer.

**Response 200**

```json
{
  "items": [
    {
      "id": "notif_xxx",
      "userId": "usr_xxx",
      "type": "info",
      "title": "Nueva reserva",
      "message": "Tienes una nueva reserva en...",
      "link": "/bookings/xxx",
      "read": false,
      "createdAt": "2025-01-20T00:00:00.000Z"
    }
  ]
}
```

### GET /api/notifications/unread-count

**Auth:** Bearer.

**Response 200**

```json
{
  "unread": 3
}
```

### POST /api/notifications — Crear notificación (mock/testing)

**Auth:** Bearer. Útil para pruebas: crea una notificación para el usuario actual.

**Body (JSON)**

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| type | string | No (default "info") |
| title | string | No |
| message | string | No |
| link | string | No |

**Response 201:** Objeto notificación creada.

### POST /api/notifications/read-all

**Auth:** Bearer. Marca todas como leídas.

**Response 200**

```json
{
  "ok": true,
  "count": 5
}
```

### PATCH /api/notifications/:id/read

**Auth:** Bearer. Marca una notificación como leída.

**Response 200:** Objeto notificación actualizado.

**Errores:** 404 (NOTIFICATION_NOT_FOUND)

---

## 10. Host (dashboard)

### GET /api/host/dashboard

**Auth:** Bearer. Estadísticas y resumen para el anfitrión.

**Response 200**

```json
{
  "stats": {
    "propertiesCount": 2,
    "bookingsCount": 5,
    "reviewsCount": 3,
    "averageRating": 4.7,
    "earningsTotal": 1200,
    "unreadNotifications": 1
  },
  "recentBookings": [...],
  "recentReviews": [...],
  "notifications": [...]
}
```

---

## 11. Search

### GET /api/search/suggestions

**Query**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| q | string | Texto para sugerir ubicaciones |

**Response 200**

```json
{
  "suggestions": ["Barcelona", "Barcelona Centro", "Madrid"]
}
```

### GET /api/search/history

**Auth:** Bearer. Últimas búsquedas del usuario.

**Response 200**

```json
{
  "items": [
    {
      "query": "playa",
      "location": "Valencia",
      "minPrice": 50,
      "maxPrice": 150,
      "checkIn": "2025-03-01",
      "checkOut": "2025-03-05"
    }
  ]
}
```

### POST /api/search/history — Guardar búsqueda

**Auth:** Bearer.

**Body (JSON)** — todos opcionales

| Campo | Tipo |
|-------|------|
| q | string |
| location | string |
| minPrice | number |
| maxPrice | number |
| checkIn | string |
| checkOut | string |

**Response 201**

```json
{
  "ok": true,
  "items": [...]
}
```

### DELETE /api/search/history

**Auth:** Bearer. Vacía el historial de búsquedas.

**Response 200:** `{ "ok": true }`

---

## Flujos recomendados

### Checkout (reserva)

1. `GET /api/properties/:id` — Datos de la propiedad.
2. `GET /api/properties/:id/booking-preview?checkIn=...&checkOut=...&guests=...` — Disponibilidad y precio.
3. `POST /api/bookings` con `propertyId`, `checkIn`, `checkOut`, `guests`.
4. `GET /api/bookings/:id?include=property` — Detalle de la reserva con propiedad.

Errores posibles: 409 NOT_AVAILABLE, 400 GUESTS_EXCEED_MAX, 404 PROPERTY_NOT_FOUND.

### Registro y perfil

1. `POST /api/auth/register` (o signup) — Registrar.
2. Guardar `accessToken` y usarlo en `Authorization: Bearer <token>`.
3. `GET /api/users/me` — Perfil y stats.
4. `PATCH /api/users/me` — Actualizar perfil.

### Recuperar contraseña

1. `POST /api/auth/forgot-password` con `{ "email": "..." }`.
2. En desarrollo la respuesta incluye `resetToken` y `expiresAt`.
3. `GET /api/auth/reset-password/validate?token=...` — Validar token.
4. `POST /api/auth/reset-password` con `{ "token": "...", "password": "nueva" }`.

---

*Documento generado a partir del código del backend. Colección Postman: `doks/backend/postman/Airbnb-Backend-API.postman_collection.json`.*
