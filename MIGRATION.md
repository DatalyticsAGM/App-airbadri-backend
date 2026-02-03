# Plan de migración: compatibilidad MOCK (memoria) y MongoDB

Este documento describe el plan para que el backend soporte **dos modos de persistencia** sin introducir **breaking changes**:

- **Modo MOCK (memoria)**: para desarrollo local y pruebas. No requiere MongoDB.
- **Modo MongoDB**: para producción. Conexión real a base de datos.

La decisión se toma por configuración (`USE_MEMORY_ONLY` y `MONGO_URI`). La API REST, los tipos de respuesta y el comportamiento funcional se mantienen idénticos en ambos modos.

---

## Principio rector: cero breaking changes

En cada paso se debe garantizar:

1. **API REST**: mismas rutas, métodos, códigos HTTP, estructura JSON de request/response.
2. **Tipos públicos**: los tipos exportados que consumen controladores o frontend (p. ej. `PublicUser`, `ListPropertiesResult`, `BookingPreview`) no cambian de forma ni de nombre.
3. **Comportamiento**: validaciones, reglas de negocio y mensajes de error se mantienen.
4. **Compatibilidad hacia atrás**: con `USE_MEMORY_ONLY=true` (o sin `MONGO_URI`), el sistema debe comportarse exactamente como antes de la migración.
5. **No eliminar ni renombrar** exports usados por otros módulos hasta que exista un reemplazo y se haya migrado el consumidor.

---

## Estado actual (referencia)

### Decisión de persistencia

- **`src/config/env.ts`**: `USE_MEMORY_ONLY` (true = memoria), `MONGO_URI` (URI de MongoDB).
- **`src/server.ts`**: si `MONGO_URI` está definido y no `USE_MEMORY_ONLY`, se llama a `connectDb(env.MONGO_URI)`; si no, se arranca en modo MOCK sin conectar.

### Quién usa qué

| Módulo | Store / modelo actual | Nota |
|--------|------------------------|------|
| `auth.service` | `models/User` + `store/memoryUsers` | Ya dual: `isDbReady()` elige uno u otro. |
| `properties.service` | `memoryProperties`, `memoryBookings`, `memoryReviews` | Solo memoria. |
| `bookings.service` | `memoryBookings`, `memoryProperties`, `notifications.service` | Solo memoria. |
| `reviews.service` | `memoryReviews`, `memoryProperties`, `memoryBookings` | Solo memoria. |
| `favorites.service` | `memoryFavorites`, `memoryProperties` | Solo memoria. |
| `notifications.service` | `memoryNotifications` | Solo memoria. |
| `dev/seed.ts` | Todos los `memory*` + `createUser` (auth) | Reset + creación en memoria. |
| `search.controller` | `memoryProperties`, `memorySearchHistory` | Solo memoria. |
| `host.controller` | `memoryBookings`, `memoryProperties`, `memoryReviews` | Solo memoria. |
| `user.controller` | `memoryBookings`, `memoryProperties` | Solo memoria. |

### Stores existentes y operaciones

- **memoryUsers**: create, findById, findByEmail, update, delete, setResetPasswordToken, findUserByValidResetToken, resetPassword, memoryResetForDev.
- **memoryProperties**: list, getById, listByHost, create, update, delete, memoryResetForDev.
- **memoryBookings**: create, getById, list, listByUser, listByProperty, updateStatus, deleteBookingsByProperty, memoryResetForDev.
- **memoryReviews**: listByProperty, findById, findByPropertyAndUser, create, update, delete, memoryCalculateAverageRating, memoryResetForDev.
- **memoryFavorites**: getByUser, isFavorite, add, remove, memoryResetForDev.
- **memoryNotifications**: getByUser, create, markAsRead, markAllAsRead, getUnreadCount, memoryResetForDev.
- **memorySearchHistory**: get, add, clear, memoryResetForDev.

---

## Paso 1: Definir interfaces de repositorio (contratos)

**Objetivo:** Tener un contrato TypeScript por entidad que describa las operaciones que los servicios necesitan. Los servicios dejarán de depender de “memory*” o “Model” directamente y dependerán de estas interfaces.

**Acciones:**

1. Crear una carpeta `src/repositories/` (o `src/store/contracts/` si se prefiere mantener todo bajo store).
2. Por cada entidad, definir un archivo de tipos que exporte solo **interfaces** (sin implementación):
   - `repositories/user.repository.types.ts` (o un único `repositories/types.ts` con todos).
   - `repositories/property.repository.types.ts`
   - `repositories/booking.repository.types.ts`
   - `repositories/review.repository.types.ts`
   - `repositories/favorite.repository.types.ts`
   - `repositories/notification.repository.types.ts`
   - `repositories/searchHistory.repository.types.ts` (opcional; si el historial se persiste en Mongo).

3. Cada interfaz debe reflejar **exactamente** las firmas que hoy usan los servicios (mismos parámetros y tipos de retorno). Ejemplo para propiedades:
   - `list(): T[]`
   - `getById(id: string): T | null`
   - `listByHost(hostId: string): T[]`
   - `create(params: ...): T`
   - `update(id: string, patch: ...): T | null`
   - `delete(id: string): boolean`
   Donde `T` es el tipo ya existente (p. ej. `Property` de `store/memoryProperties`).

4. Reutilizar los **tipos de dominio** existentes (Property, Booking, Review, etc.) importándolos desde los stores actuales; no crear tipos duplicados con otros nombres. Las interfaces del repositorio devuelven esos mismos tipos.

**Evitar breaking changes:**

- No cambiar nombres ni estructuras de los tipos ya exportados por `store/*` (Property, Booking, Review, etc.).
- Las interfaces son **nuevas** y no sustituyen exports existentes hasta el paso 5. En este paso ningún servicio ni controlador cambia sus imports.

**Entregable:** Archivos de tipos/interfaces de repositorio que describen la API de acceso a datos por entidad, alineada con el uso actual en servicios.

---

## Paso 2: Crear modelos Mongoose para entidades sin modelo

**Objetivo:** Tener esquema y modelo de Mongoose para cada entidad que hoy solo existe en memoria, de forma que los documentos guardados sean compatibles con los tipos actuales (mismos campos y significados).

**Acciones:**

1. En `src/models/` crear (o ampliar):
   - `Property.ts` – campos: hostId (ObjectId ref User), title, description, location, pricePerNight, images[], amenities[], propertyType, bedrooms, bathrooms, maxGuests, timestamps.
   - `Booking.ts` – propertyId (ref), userId (ref), checkIn, checkOut (String ISO), guests, totalPrice, status (enum), timestamps.
   - `Review.ts` – propertyId (ref), userId (ref), rating, ratingDetails (Mixed/Subdoc), comment, date (String), userName, userAvatar, timestamps.
   - `Favorite.ts` – userId (ref), propertyId (ref), date (String ISO).
   - `Notification.ts` – userId (ref), type (String), title, message, read (Boolean), date (String), link, timestamps.
   - (Opcional) `SearchHistoryEntry` como subdocumento o colección separada si se persiste historial en Mongo.

2. Usar `timestamps: true` para que Mongoose gestione `createdAt` y `updatedAt` de forma equivalente al store en memoria.
3. Los tipos TypeScript del documento (p. ej. `PropertyDoc`) deben poder mapearse a la forma que ya usa la API (id como string, fechas como Date). Definir helpers o métodos que conviertan documento → tipo plano con `id` (no `_id`) para no romper respuestas JSON.

**Evitar breaking changes:**

- No cambiar los nombres de campos que ya expone la API (title, description, location, pricePerNight, images, amenities, etc.).
- Las respuestas de la API siguen usando `id` (string); internamente Mongo usa `_id`. La capa repositorio (paso 3) hará la traducción documento → objeto con `id`, de modo que controladores y frontend no vean cambio alguno.
- No eliminar ni modificar `src/models/User.ts`; ya existe y se usa en auth.

**Entregable:** Archivos en `src/models/` para Property, Booking, Review, Favorite, Notification (y opcional SearchHistory), con schemas alineados a los tipos actuales de los stores.

---

## Paso 3: Implementar repositorios MongoDB

**Objetivo:** Implementar, por cada entidad, un módulo que use los modelos Mongoose y exponga la misma interfaz definida en el paso 1. Así los servicios podrán usar “repositorio” sin saber si es memoria o Mongo.

**Acciones:**

1. Crear implementaciones en `src/repositories/`, por ejemplo:
   - `mongo/user.repository.ts`
   - `mongo/property.repository.ts`
   - `mongo/booking.repository.ts`
   - `mongo/review.repository.ts`
   - `mongo/favorite.repository.ts`
   - `mongo/notification.repository.ts`
   - (Opcional) `mongo/searchHistory.repository.ts`

2. Cada implementación debe:
   - Recibir o importar el modelo Mongoose correspondiente.
   - Implementar cada método de la interfaz del paso 1.
   - Devolver objetos **planos** con `id` como string (por ejemplo `doc._id.toString()`), no exponer `_id` ni documentos de Mongoose. Usar `.lean()` donde sea posible y mapear `_id` → `id` para mantener la misma forma que la API actual.
   - Mantener los mismos tipos de retorno (incluyendo `null` cuando corresponda) y las mismas semánticas (p. ej. listByHost devuelve array, getById devuelve null si no existe).

3. Para User, el repositorio Mongo puede encapsular las operaciones que hoy hace `auth.service` contra el modelo `User` (create, findOne por email, findById, updateOne, etc.), devolviendo siempre la forma que el servicio espera (incl. id como string).

**Evitar breaking changes:**

- Las firmas de las funciones del repositorio Mongo deben ser **idénticas** a las de la interfaz (y a las de los memory stores en uso). Mismos parámetros, mismos tipos de retorno.
- Cualquier campo que la API actual devuelve (p. ej. `createdAt`, `updatedAt` como ISO o Date) debe seguir presente y con el mismo tipo en el objeto devuelto por el repositorio Mongo.
- No añadir campos nuevos a las respuestas de la API en esta fase; solo replicar el comportamiento actual.

**Entregable:** Módulos de repositorio Mongo que implementan las interfaces del paso 1 y devuelven datos con la misma forma que los stores en memoria.

---

## Paso 4: Adaptar stores en memoria como implementaciones del mismo contrato

**Objetivo:** Que los stores actuales (memory*) se expongan como implementaciones de las interfaces del paso 1, sin cambiar su lógica interna. Así “memoria” y “Mongo” son dos implementaciones intercambiables del mismo contrato.

**Acciones:**

1. Crear wrappers o adapters en `src/repositories/memory/` (o reutilizar `src/store/` y exportar objetos que implementen la interfaz):
   - Cada archivo importa las funciones existentes de `store/memory*` y las agrupa en un objeto que cumple la interfaz del repositorio (mismos nombres de método y firmas).
2. Las funciones actuales de `store/*` **no se eliminan ni se renombran** en este paso; solo se reutilizan. Los adapters son una capa fina que llama a `memoryCreateProperty`, `memoryGetPropertyById`, etc.
3. Para User: el adapter de memoria usará `memoryCreateUser`, `memoryFindUserById`, etc. La forma devuelta (incl. id) debe coincidir con la que ya usa `auth.service` (getUserId, toPublicUser), sin cambios.

**Evitar breaking changes:**

- No modificar la implementación interna de los `memory*` (Maps, lógica de negocio). Solo añadir una capa que los llame y cumpla la interfaz.
- Los stores siguen exportando sus funciones y tipos; otros archivos que aún importen directamente de `store/*` (p. ej. seed o controladores que aún no se hayan migrado) deben seguir funcionando. La migración de consumidores es el paso 5.

**Entregable:** Capa adapter/wrapper que expone los stores en memoria como implementaciones de las interfaces de repositorio.

---

## Paso 5: Punto único de decisión (memoria vs Mongo)

**Objetivo:** Centralizar la decisión “usar memoria o Mongo” en un solo módulo, para no repetir `isDbReady()` o comprobaciones de `USE_MEMORY_ONLY` en cada servicio.

**Acciones:**

1. Crear un módulo, por ejemplo `src/repositories/index.ts` o `src/config/repositories.ts`, que:
   - Importe `env` (USE_MEMORY_ONLY) y, si se desea, el estado de conexión de Mongoose (connection.readyState === 1).
   - Defina la regla: si `USE_MEMORY_ONLY === true` O no hay conexión a Mongo, exportar los repositorios de memoria; en caso contrario, exportar los repositorios Mongo.
   - Exportar un único objeto (o un getter por entidad) que exponga los repositorios ya elegidos, por ejemplo:
     - `userRepository`, `propertyRepository`, `bookingRepository`, `reviewRepository`, `favoriteRepository`, `notificationRepository`, (opcional) `searchHistoryRepository`.

2. No cambiar aún la lógica de `auth.service` ni del resto de servicios; solo tener el punto único listo para que en el paso 6 los servicios consuman desde aquí.

**Evitar breaking changes:**

- El comportamiento del sistema no cambia hasta que los servicios no cambien sus imports (paso 6). Este paso solo añade un nuevo módulo que decide y expone repositorios.
- La regla debe ser conservadora: en caso de duda (p. ej. USE_MEMORY_ONLY no definido pero MONGO_URI vacío), preferir memoria para no romper entornos que hoy funcionan sin Mongo.

**Entregable:** Un único módulo que, según env y conexión, exporta el conjunto de repositorios (memoria o Mongo) a usar en toda la app.

---

## Paso 6: Refactorizar servicios para usar solo repositorios

**Objetivo:** Que cada servicio deje de importar `store/memory*` y, donde aplique, el modelo User directamente; en su lugar, usará solo el repositorio inyectado o obtenido del punto único del paso 5.

**Acciones (por servicio):**

1. **auth.service**  
   - Sustituir uso directo de `User` (Mongoose) y de `memory*` por el `userRepository` obtenido del módulo del paso 5.  
   - Todas las operaciones (createUser, findUserByEmail, findUserById, updateUserProfile, setResetPasswordToken, findUserByValidResetToken, resetPassword, deleteUserById) deben ir contra el repositorio.  
   - El repositorio (memoria o Mongo) devuelve la forma que ya usa el servicio (getUserId, toPublicUser). No cambiar esas utilidades ni los tipos exportados (PublicUser, etc.).

2. **properties.service**  
   - Reemplazar imports de `memoryProperties`, `memoryBookings`, `memoryReviews` por el uso de `propertyRepository`, `bookingRepository` (solo para disponibilidad/limpieza si aplica), `reviewRepository` (para rating medio).  
   - Mantener la misma lógica de filtros, ordenación y paginación; solo cambiar el origen de datos (list, getById, listByHost, create, update, delete).

3. **bookings.service**  
   - Usar `bookingRepository` y `propertyRepository` (para getPropertyById y para deleteBookingsByProperty si está en el contrato).  
   - Mantener validaciones de fechas, solapamientos y notificaciones; solo cambiar el acceso a datos.

4. **reviews.service**  
   - Usar `reviewRepository` y `propertyRepository` (y bookingRepository si se usa para “solo huéspedes que estuvieron”).  
   - Mantener reglas de una review por reserva y cálculo de promedio.

5. **favorites.service**  
   - Usar `favoriteRepository` y `propertyRepository` (getById para validar propiedad existente).

6. **notifications.service**  
   - Usar `notificationRepository` para create, getByUser, markAsRead, markAllAsRead, getUnreadCount.

7. **Controladores que hoy importan store**  
   - `search.controller`: usar repositorios de propiedades y de searchHistory (si existe).  
   - `host.controller`: usar repositorios de bookings, properties, reviews.  
   - `user.controller`: usar repositorios de bookings, properties.  
   Los controladores no deben importar `store/memory*` ni modelos; solo servicios y, si aplica, repositorios expuestos por el punto único.

**Evitar breaking changes:**

- No cambiar firmas de las funciones exportadas por los servicios (listProperties, getPropertyByIdOrThrow, createBooking, etc.). Los controladores siguen llamando a los mismos métodos con los mismos argumentos.
- No cambiar tipos exportados (ListPropertiesResult, BookingPreview, etc.); pueden seguir usando los tipos de dominio (Property, Booking) que ahora vienen del repositorio en lugar del store.
- Revisar que ningún import de `store/memory*` ni de `models/User` quede en servicios o controladores una vez migrados; todo debe pasar por el punto único de repositorios.
- Ejecutar la app en modo memoria después de cada cambio y comprobar que las respuestas JSON y códigos HTTP son idénticos a los actuales.

**Entregable:** Servicios y controladores refactorizados para depender solo de la capa de repositorio; modo memoria sigue funcionando igual que antes.

---

## Paso 7: Seed y health/ready

**Objetivo:** Seed que funcione en ambos modos; endpoint de salud que refleje el estado real de la persistencia.

**Acciones:**

1. **Seed (`src/dev/seed.ts`)**  
   - Dejar de llamar directamente a `memoryResetForDev` y a `memoryCreate*` cuando se use Mongo.  
   - Usar el mismo punto único del paso 5: si el modo es memoria, usar los repositorios (que internamente harán reset si se mantiene una función `resetForDev` solo en el adapter de memoria) y crear datos mediante los repositorios; si el modo es Mongo, no llamar a reset de memoria, y crear usuarios/propiedades/reservas/reviews/favoritos/notificaciones mediante los repositorios Mongo (o modelos) para poblar la base.  
   - Definir si en Mongo se hace “clear” de colecciones en seed (solo en dev) o se evita borrar datos de producción; documentarlo en este archivo o en README.  
   - Mantener la misma forma del resultado de `runSeed()` (ok, users, propertiesCount, bookingsCount) para no romper quien consuma el endpoint de seed.

2. **Health/Ready**  
   - En `app.ts`, en el endpoint `/ready` (o `/health`): si no estás en modo memoria, incluir en la respuesta el estado de MongoDB (p. ej. `mongoose.connection.readyState === 1`). Si estás en memoria, seguir respondiendo `{ ok: true, ready: true }` sin exigir Mongo.  
   - No cambiar la ruta ni el contrato del endpoint existente si ya lo usa un orquestador o un frontend; solo añadir un campo opcional (p. ej. `mongo: 'connected' | 'disconnected'`) cuando aplique.

**Evitar breaking changes:**

- El endpoint de seed (POST /api/dev/seed o similar) debe seguir devolviendo la misma estructura.  
- Los endpoints `/health` y `/ready` no deben cambiar de ruta ni dejar de responder; solo se puede enriquecer la respuesta con información de Mongo cuando sea relevante.

**Entregable:** Seed que funciona en memoria y en Mongo; documentación de comportamiento en cada modo. Health/ready que indique estado de Mongo en modo producción sin romper clientes actuales.

---

## Paso 8: Verificación y documentación de uso

**Objetivo:** Dejar documentado cómo usar ambos modos y verificar que no hay regresiones.

**Acciones:**

1. **Checklist de verificación (sin breaking changes)**  
   - Con `USE_MEMORY_ONLY=true` (y sin MONGO_URI o con MONGO_URI vacío):  
     - Registro, login, perfil, reset password.  
     - CRUD propiedades, listado con filtros y paginación.  
     - Reservas: preview, crear, listar, cancelar; disponibilidad.  
     - Reviews: crear, listar por propiedad, valoración media.  
     - Favoritos: añadir, quitar, listar.  
     - Notificaciones: listar, marcar leídas.  
     - Seed: ejecutar y comprobar que los datos aparecen; reiniciar y comprobar que en memoria se pierden (comportamiento esperado).  
   - Con `MONGO_URI` definido y `USE_MEMORY_ONLY` no definido (o false):  
     - Mismas operaciones; datos deben persistir tras reiniciar.  
     - Seed (si aplica) debe poblar Mongo sin depender de memoria.  
   - Comparar respuestas JSON (campos, tipos, códigos HTTP) entre ambos modos para los mismos flujos; deben ser equivalentes.

2. **Documentación**  
   - En README o en este MIGRATION.md: tabla de variables de entorno (MONGO_URI, USE_MEMORY_ONLY, JWT_SECRET, etc.) y cuándo usar cada modo (local vs producción).  
   - Indicar que no se deben introducir breaking changes en la API pública durante la migración.

**Evitar breaking changes:**

- Cualquier diferencia de comportamiento entre memoria y Mongo que afecte al cliente (códigos HTTP, estructura JSON, mensajes de error) debe tratarse como bug y corregirse para que ambos modos sean equivalentes desde el punto de vista del consumidor de la API.

**Entregable:** Checklist ejecutado y documentación actualizada; incidencias detectadas corregidas.

---

## Resumen de orden de ejecución

| Paso | Descripción |
|------|-------------|
| 1 | Definir interfaces de repositorio (solo tipos; sin cambiar consumidores). |
| 2 | Crear modelos Mongoose (Property, Booking, Review, Favorite, Notification). |
| 3 | Implementar repositorios MongoDB que cumplan las interfaces. |
| 4 | Exponer stores en memoria como implementaciones de las mismas interfaces. |
| 5 | Crear módulo único que elige y exporta memoria o Mongo. |
| 6 | Refactorizar servicios y controladores para usar solo repositorios. |
| 7 | Adaptar seed y health/ready para ambos modos. |
| 8 | Verificación y documentación. |

---

## Uso por entorno

- **Local / pruebas (MOCK):**  
  `USE_MEMORY_ONLY=true`  
  No es necesario definir `MONGO_URI`. Mismo `JWT_SECRET` y resto de env.

- **Producción (MongoDB):**  
  `MONGO_URI=<uri>`  
  No definir `USE_MEMORY_ONLY` o `USE_MEMORY_ONLY=false`.  
  Mismo `JWT_SECRET` y resto de env.

Con esto, el sistema queda compatible con MOCK en local y MongoDB en producción sin breaking changes en la API ni en los contratos que consumen los clientes.

---

## Estado: migración aplicada

La migración se ha implementado según este plan. Resumen de cambios:

- **Nuevos:** `src/repositories/types.ts`, `src/repositories/mongo/*.ts`, `src/repositories/memory/*.ts`, `src/repositories/index.ts`, `src/models/Property.ts`, `Booking.ts`, `Review.ts`, `Favorite.ts`, `Notification.ts`. Campo opcional `avatarUrl` en `User`.
- **Modificados:** Todos los servicios usan repositorios (async); controladores con `await` donde corresponde; `dev/seed.ts` usa repos y `resetAllMemoryForDev` en modo memoria; `/ready` incluye estado de Mongo cuando no es modo memoria.
- **API REST:** Sin cambios de rutas, códigos HTTP ni estructura JSON.

### Checklist de verificación manual

- [ ] Con `USE_MEMORY_ONLY=true`: arrancar, registrar usuario, login, CRUD propiedades, reservas, reviews, favoritos, notificaciones; ejecutar `POST /api/dev/seed` y comprobar datos; reiniciar y comprobar que se pierden.
- [ ] Con `MONGO_URI` válido y sin `USE_MEMORY_ONLY`: arrancar, mismas operaciones, ejecutar seed, reiniciar y comprobar persistencia.
- [ ] Comparar respuestas JSON en ambos modos para los mismos flujos.
