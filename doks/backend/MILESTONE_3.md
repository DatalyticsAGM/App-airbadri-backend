# 🎯 Milestone 3 (Backend): Reviews, Favoritos, Notificaciones, Dashboard Host (API REST MOCK)

## 📋 Fuente de verdad

- Frontend: `doks/frontend/MILESTONE_3.md`
- Reglas: `.cursor/rules/No-dependencias.mdc`
  - Sin dependencias nuevas salvo necesidad extrema.
  - Preferir Node/TypeScript nativo.
  - Persistencia **in‑memory** (mocks) en este milestone, sin MongoDB real.

---

## 🎯 Objetivo

Extender el backend para soportar las mejoras de UX/engagement del frontend (reviews, búsqueda avanzada por rating/fechas, notificaciones, favoritos y dashboard de host), manteniendo:

- Arquitectura **MVC** sencilla.
- Persistencia en stores **in‑memory**.
- API REST clara y consistente con Milestones 1 y 2.

---

## ✅ Principios / restricciones

- **No** agregar nuevas dependencias NPM.
- Todos los datos nuevos (reviews, favoritos, notificaciones) viven en stores in‑memory:
  - `memoryReviews.ts`
  - `memoryFavorites.ts`
  - `memoryNotifications.ts`
- Reutilizar estructuras existentes:
  - `memoryProperties.ts`, `memoryBookings.ts`, `memoryUsers.ts`
  - Middlewares: `requireAuth`, `asyncHandler`, `errorHandler`.
- Respuestas de error homogéneas:
  - `{"error": {"code": "SOME_CODE", "message": "..."}}`.

---

## 🧩 Milestone 3 — Tareas (máximo 5)

### 1) Dominio `reviews`: modelo + store + reglas de negocio

**Alcance**

- Definir entidad `Review`:
  - `id`, `propertyId`, `userId`
  - `rating` (1–5), `ratingDetails?` (detalle opcional)
  - `comment`, `date` (ISO string)
  - `userName`, `userAvatar?`
- Implementar store in‑memory `memoryReviews` con operaciones:
  - `memoryListReviewsByProperty(propertyId)`
  - `memoryFindReviewById(id)`
  - `memoryFindReviewByPropertyAndUser(propertyId, userId)`
  - `memoryCreateReview(reviewData)`
  - `memoryUpdateReview(id, patch)`
  - `memoryDeleteReview(id)`
  - `memoryCalculateAverageRating(propertyId)`
- Regla de negocio:
  - Solo usuarios con **reserva completada** de esa propiedad pueden crear review.
  - Solo el autor puede editar / borrar su review.

**Criterios de aceptación**

- `rating` siempre entre `1` y `5`.
- Un usuario solo puede tener **una review por propiedad** (si ya existe → `409 REVIEW_ALREADY_EXISTS`).
- `memoryCalculateAverageRating` devuelve promedio con 1 decimal (ej: `4.3`).

---

### 2) API REST `reviews` + integración con `properties`

**Alcance**

- Endpoints:
  - `GET /api/properties/:id/reviews`
    - Devuelve: `{ items, averageRating, total }`.
  - `POST /api/properties/:id/reviews` (Bearer)
    - Crea review para la propiedad (si tiene reserva completada).
  - `PATCH /api/reviews/:id` (Bearer)
    - Editar `rating` y/o `comment` si la review es del usuario.
  - `DELETE /api/reviews/:id` (Bearer)
    - Borrar review propia.
- Integrar rating en búsqueda de propiedades:
  - En `GET /api/properties` aceptar `minRating` y filtrar con `memoryCalculateAverageRating`.
- Integrar filtro por disponibilidad:
  - `GET /api/properties` acepta `checkIn` y `checkOut` y usa `isPropertyAvailable` para excluir propiedades no disponibles en ese rango.

**Criterios de aceptación**

- Usuario sin reserva completada para la propiedad → `403 FORBIDDEN`.
- Usuario distinto del autor → `403 FORBIDDEN` en `PATCH` / `DELETE`.
- `GET /api/properties/:id/reviews` devuelve 404 si la propiedad no existe.

---

### 3) Sistema de `favorites` (wishlist) in‑memory

**Alcance**

- Definir entidad `Favorite`:
  - `id`, `userId`, `propertyId`, `date`.
- Store in‑memory `memoryFavorites`:
  - `memoryGetFavoritesByUser(userId)`
  - `memoryAddFavorite(userId, propertyId)`
  - `memoryRemoveFavorite(userId, propertyId)`
  - `memoryIsFavorite(userId, propertyId)`
- API REST:
  - `GET /api/favorites` (Bearer)
    - Lista favoritos del usuario actual.
  - `POST /api/favorites` (Bearer)
    - Body: `{ "propertyId": "..." }`.
    - Idempotente: no duplica si ya existe.
  - `GET /api/favorites/:propertyId` (Bearer)
    - Devuelve `{ "favorite": boolean }`.
  - `DELETE /api/favorites/:propertyId` (Bearer)
    - Elimina favorito (si existe).

**Criterios de aceptación**

- No se puede añadir favorito de una propiedad inexistente → `404 PROPERTY_NOT_FOUND`.
- Repetir `POST /api/favorites` con el mismo `propertyId` **no** genera duplicados.
- Todas las rutas requieren `Authorization: Bearer ...`.

---

### 4) Sistema de `notifications` (MOCK) para bookings y reviews

**Alcance**

- Entidad `Notification`:
  - `id`, `userId`
  - `type` (`booking_confirmed`, `booking_cancelled`, `new_review`, `info`, …)
  - `title`, `message`, `read`, `date`, `link?`.
- Store in‑memory `memoryNotifications`:
  - `memoryGetNotificationsByUser(userId)`
  - `memoryCreateNotification(notificationData)`
  - `memoryMarkAsRead(userId, id)`
  - `memoryMarkAllAsRead(userId)`
  - `memoryGetUnreadCount(userId)`
- API REST:
  - `GET /api/notifications` (Bearer)
  - `GET /api/notifications/unread-count` (Bearer)
  - `POST /api/notifications/read-all` (Bearer)
  - `PATCH /api/notifications/:id/read` (Bearer)
  - (Opcional DEV) `POST /api/notifications` (Bearer) para crear notificación manual.
- Integración con bookings:
  - Al crear booking → notificación `booking_confirmed` al host.
  - Al cancelar booking → notificación `booking_cancelled` al host.
- Integración con reviews:
  - Al crear review → notificación `new_review` al host de la propiedad.

**Criterios de aceptación**

- Un usuario solo puede marcar como leída su propia notificación.
- `unread-count` refleja el total de notificaciones con `read = false`.
- El host recibe notificaciones al menos para:
  - Nueva reserva confirmada.
  - Reserva cancelada.
  - Nueva review.

---

### 5) Dashboard Host: stats mínimas para hosts

**Alcance**

- Endpoint protegido:
  - `GET /api/host/dashboard` (Bearer).
- Datos para el host autenticado:
  - `stats`:
    - `propertiesCount`: nº de propiedades donde `hostId = userId`.
    - `bookingsCount`: nº de reservas sobre esas propiedades.
    - `reviewsCount`: nº de reviews de esas propiedades.
    - `averageRating`: promedio global de reviews del host.
    - `earningsTotal`: suma de `totalPrice` de reservas no canceladas.
    - `unreadNotifications`: resultado de `getUnreadCount(hostId)`.
  - `recentBookings`: últimas N reservas (ordenadas por `createdAt`).
  - `recentReviews`: últimas N reviews (ordenadas por `createdAt`).
  - `notifications`: últimas N notificaciones del host.

**Criterios de aceptación**

- Sin token → `401 UNAUTHORIZED`.
- Solo se consideran propiedades cuyo `hostId` coincide con el usuario autenticado.
- Las cifras mostradas son coherentes con:
  - `GET /api/properties/mine`
  - `GET /api/bookings`
  - `GET /api/properties/:id/reviews`
  - `GET /api/notifications` / `/unread-count`.

---

## 🧱 Estructura de carpetas (resumen)

- `src/routes/`
  - `auth.routes.ts`
  - `properties.routes.ts`
  - `bookings.routes.ts`
  - `users.routes.ts`
  - `reviews.routes.ts`
  - `notifications.routes.ts`
  - `favorites.routes.ts`
  - `host.routes.ts`
  - `index.ts`
- `src/controllers/`
  - `auth.controller.ts`
  - `properties.controller.ts`
  - `bookings.controller.ts`
  - `user.controller.ts`
  - `reviews.controller.ts`
  - `notifications.controller.ts`
  - `favorites.controller.ts`
  - `host.controller.ts`
- `src/services/`
  - `auth.service.ts`
  - `properties.service.ts`
  - `bookings.service.ts`
  - `reviews.service.ts`
  - `notifications.service.ts`
  - `favorites.service.ts`
- `src/store/`
  - `memoryUsers.ts`
  - `memoryProperties.ts`
  - `memoryBookings.ts`
  - `memoryReviews.ts`
  - `memoryNotifications.ts`
  - `memoryFavorites.ts`

---

## ✅ Criterios de aceptación globales del Milestone 3 (Backend)

- Reviews:
  - Usuarios con reserva completada pueden crear/editar/borrar su review.
  - `GET /api/properties/:id/reviews` funciona y expone promedio.
- Favoritos:
  - Usuarios pueden marcar/desmarcar propiedades como favoritas y listarlas.
- Notificaciones:
  - Los hosts reciben notificaciones al menos en bookings y reviews.
  - Se pueden consultar y marcar como leídas.
- Dashboard host:
  - `GET /api/host/dashboard` devuelve stats razonables + recientes reservas/reviews/notificaciones.
- No se añadieron dependencias nuevas y todo funciona con stores in‑memory.
