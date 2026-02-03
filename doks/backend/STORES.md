# Contratos de stores in-memory (Backend)

Documentación de los métodos públicos de cada store en `src/store/`. Sirve como contrato para implementar en el futuro un adaptador de persistencia (p. ej. MongoDB) sin cambiar la lógica de los servicios.

---

## memoryUsers

**Archivo:** `src/store/memoryUsers.ts`  
**Tipos exportados:** `MemoryUser`

| Función | Descripción |
|---------|-------------|
| `memoryCreateUser(params: { fullName, email, passwordHash })` | Crea usuario; devuelve `MemoryUser` con `id` generado. |
| `memoryFindUserByEmail(email)` | Busca por email (case-insensitive). Devuelve `MemoryUser \| null`. |
| `memoryFindUserById(id)` | Busca por id. Devuelve `MemoryUser \| null`. |
| `memoryUpdateUser(userId, patch: { fullName?, email?, avatarUrl? })` | Actualiza campos. Devuelve `MemoryUser \| null`. |
| `memoryDeleteUser(userId)` | Elimina usuario. Devuelve `boolean`. |
| `memorySetResetPasswordToken(userId, token, expiresAt)` | Guarda token de reset (hash) y expiración. |
| `memoryFindUserByValidResetToken(token)` | Busca usuario con token válido y no expirado. Devuelve `MemoryUser \| null`. |
| `memoryResetPassword(userId, newPasswordHash)` | Actualiza password y borra token de reset. |
| `memoryResetForDev()` | Vacía todos los usuarios. Solo para seed de desarrollo. |

---

## memoryProperties

**Archivo:** `src/store/memoryProperties.ts`  
**Tipos exportados:** `Property`, `PropertyType`

| Función | Descripción |
|---------|-------------|
| `memoryListProperties()` | Devuelve todas las propiedades (array). |
| `memoryGetPropertyById(id)` | Devuelve `Property \| null`. |
| `memoryListPropertiesByHost(hostId)` | Devuelve propiedades cuyo `hostId` coincide. |
| `memoryCreateProperty(params)` | Params: todos los campos de `Property` excepto `id`, `createdAt`, `updatedAt`. Devuelve `Property`. |
| `memoryUpdateProperty(id, patch)` | Params: parcial sin `id`, `hostId`, `createdAt`, `updatedAt`. Devuelve `Property \| null`. |
| `memoryDeleteProperty(id)` | Elimina por id. Devuelve `boolean`. |
| `memoryResetForDev()` | Vacía todas las propiedades. Solo para seed. |

---

## memoryBookings

**Archivo:** `src/store/memoryBookings.ts`  
**Tipos exportados:** `Booking`, `BookingStatus`

| Función | Descripción |
|---------|-------------|
| `memoryCreateBooking(params)` | Params: `propertyId`, `userId`, `checkIn`, `checkOut`, `guests`, `totalPrice`, `status`. Devuelve `Booking`. |
| `memoryGetBookingById(id)` | Devuelve `Booking \| null`. |
| `memoryListBookings()` | Devuelve todas las reservas. |
| `memoryListBookingsByUser(userId)` | Reservas del usuario. |
| `memoryListBookingsByProperty(propertyId)` | Reservas de la propiedad. |
| `memoryUpdateBookingStatus(id, status)` | Actualiza estado. Devuelve `Booking \| null`. |
| `memoryDeleteBookingsByProperty(propertyId)` | Elimina todas las reservas de la propiedad. Devuelve número eliminado. |
| `memoryResetForDev()` | Vacía todas las reservas. Solo para seed. |

---

## memoryReviews

**Archivo:** `src/store/memoryReviews.ts`  
**Tipos exportados:** `Review`, `RatingBreakdown`

| Función | Descripción |
|---------|-------------|
| `memoryListReviewsByProperty(propertyId)` | Lista reviews de la propiedad. |
| `memoryFindReviewById(id)` | Devuelve `Review \| null`. |
| `memoryFindReviewByPropertyAndUser(propertyId, userId)` | Una review por propiedad y usuario. |
| `memoryCreateReview(params)` | Params: campos de `Review` excepto `id`, `createdAt`, `updatedAt`. Devuelve `Review`. |
| `memoryUpdateReview(id, patch)` | Patch: `rating?`, `ratingDetails?`, `comment?`, `date?`. Devuelve `Review \| null`. |
| `memoryDeleteReview(id)` | Elimina por id. Devuelve `boolean`. |
| `memoryCalculateAverageRating(propertyId)` | Promedio 1–5 con un decimal (0 si no hay reviews). |
| `memoryResetForDev()` | Vacía todas las reviews. Solo para seed. |

---

## memoryFavorites

**Archivo:** `src/store/memoryFavorites.ts`  
**Tipos exportados:** `Favorite`

| Función | Descripción |
|---------|-------------|
| `memoryGetFavoritesByUser(userId)` | Lista favoritos del usuario. |
| `memoryIsFavorite(userId, propertyId)` | Devuelve `boolean`. |
| `memoryAddFavorite(userId, propertyId)` | Añade (idempotente). Devuelve `Favorite`. |
| `memoryRemoveFavorite(userId, propertyId)` | Elimina. Devuelve `boolean`. |
| `memoryResetForDev()` | Vacía todos los favoritos. Solo para seed. |

---

## memoryNotifications

**Archivo:** `src/store/memoryNotifications.ts`  
**Tipos exportados:** `Notification`, `NotificationType`

| Función | Descripción |
|---------|-------------|
| `memoryGetNotificationsByUser(userId)` | Lista notificaciones del usuario (ordenadas por fecha desc). |
| `memoryCreateNotification(params)` | Params: campos excepto `id`, `createdAt`, `updatedAt`. Devuelve `Notification`. |
| `memoryMarkAsRead(userId, id)` | Marca una como leída si pertenece al usuario. Devuelve `Notification \| null`. |
| `memoryMarkAllAsRead(userId)` | Marca todas del usuario como leídas. Devuelve número actualizado. |
| `memoryGetUnreadCount(userId)` | Cuenta no leídas. |
| `memoryResetForDev()` | Vacía todas las notificaciones. Solo para seed. |

---

## memorySearchHistory

**Archivo:** `src/store/memorySearchHistory.ts`  
**Tipos exportados:** `SearchHistoryEntry`

| Función | Descripción |
|---------|-------------|
| `memoryGetSearchHistory(userId)` | Devuelve entradas del usuario (máx. 20 por usuario). |
| `memoryAddSearchHistory(userId, entry)` | Añade entrada (campos opcionales: query, location, minPrice, maxPrice, checkIn, checkOut). `date` se asigna en el store. |
| `memoryClearSearchHistory(userId)` | Vacía historial del usuario. |
| `memoryResetForDev()` | Vacía todo el historial. Solo para seed. |

---

## Uso de `memoryResetForDev()`

Las funciones `memoryResetForDev()` existen en todos los stores y **solo deben usarse** desde el seed de desarrollo (`POST /api/dev/seed`), que a su vez solo está disponible cuando `USE_MEMORY_ONLY=true` o `NODE_ENV=development`. En producción no se exponen las rutas `/api/dev`.
