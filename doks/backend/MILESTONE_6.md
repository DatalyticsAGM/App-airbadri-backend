# 🎯 Milestone 6 (Backend): Soporte para Checkout y Confirmación de Reserva

## 📋 Fuente de verdad

- Frontend: `doks/frontend/MILESTONE_6.md` (Pantalla de checkout: resumen, precios, datos de usuario, confirmar reserva)
- Reglas: `.cursor/rules/No-dependencias.mdc`

---

## 🎯 Objetivo

Garantizar que la API permita al frontend implementar el flujo de checkout de forma completa:

- Obtener datos de la propiedad y calcular precios (noches × precio por noche, desglose opcional).
- Validar disponibilidad antes de confirmar.
- Crear la reserva con los datos del usuario y devolver el detalle de la reserva creada para redirigir al usuario a la página de detalle de reserva.

No se añaden dependencias nuevas; se reutilizan endpoints existentes y se extienden solo donde haga falta.

---

## ✅ Principios / restricciones

- **No** agregar dependencias NPM nuevas.
- Reutilizar `memoryBookings`, `memoryProperties`, lógica de disponibilidad y cálculo de `totalPrice` ya existente.
- Respuestas de error en formato estándar: `{"error": {"code": "SOME_CODE", "message": "..."}}`.

---

## 🧩 Milestone 6 — Tareas (máximo 5)

### 1) Endpoint de “preview” de reserva (precio y disponibilidad)

**Alcance**

- Nuevo endpoint (o ampliación de uno existente) para que el frontend pueda mostrar el desglose de precios sin crear la reserva:
  - Opción A: `GET /api/properties/:id/booking-preview?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=N`
  - Opción B: Reutilizar `GET /api/properties/:id/availability` y documentar que el frontend calcula `nights * pricePerNight`; si se prefiere evitar lógica duplicada en front, ofrecer un endpoint que devuelva:
    - `available: boolean`
    - `pricePerNight: number`
    - `nights: number`
    - `totalPrice: number`
    - (Opcional) `breakdown: { nights, pricePerNight, subtotal, cleaningFee?, serviceFee?, total }` si se añaden tasas en el futuro.
- Validaciones: fechas válidas, checkIn &lt; checkOut, propiedad existente, capacidad (maxGuests) si aplica.

**Criterios de aceptación**

- Si la propiedad no existe → 404.
- Si las fechas no son válidas o checkIn ≥ checkOut → 400.
- Si no hay disponibilidad → 200 con `available: false` y opcionalmente `totalPrice: 0` o no incluir precio.
- Cálculo de `totalPrice` coherente con el que se usa en `POST /api/bookings`.

---

### 2) Contrato de `POST /api/bookings` alineado con checkout

**Alcance**

- Asegurar que `POST /api/bookings` acepte todo lo que el frontend envía desde checkout:
  - `propertyId`, `checkIn`, `checkOut`, `guests`
  - Opcional: `fullName`, `email`, `phone` para guardar en la reserva (si el modelo Booking lo soporta; si no, el backend puede ignorarlos o guardarlos en un campo opcional `guestInfo`).
- Respuesta 201 con la reserva creada (id, propertyId, userId, checkIn, checkOut, guests, totalPrice, status) para que el frontend redirija a `GET /api/bookings/:id` o a la página de detalle de reserva.

**Criterios de aceptación**

- Misma validación de disponibilidad que hoy: no permitir solapamiento con reservas activas.
- `totalPrice` calculado en backend (noches × pricePerNight); el frontend puede mostrar un preview pero el valor definitivo es el del backend.
- Documentar en API.md el body esperado y un ejemplo de respuesta 201.

---

### 3) Validación de capacidad (maxGuests) y fechas

**Alcance**

- En `POST /api/bookings` (y en el preview si existe):
  - Rechazar si `guests` &gt; `property.maxGuests` (si existe el campo) con 400 y código tipo `GUESTS_EXCEED_MAX`.
  - Rechazar si checkIn/checkOut no son fechas válidas o checkIn ≥ checkOut.
  - Rechazar si la propiedad no existe (404) o no está disponible (409 NOT_AVAILABLE).

**Criterios de aceptación**

- Mensajes de error claros para el frontend (código + message).
- Comportamiento coherente entre preview y creación de reserva.

---

### 4) Detalle de reserva listo para página post-checkout

**Alcance**

- `GET /api/bookings/:id` (Bearer) ya debe devolver toda la información que la página de detalle de reserva necesita:
  - Datos de la reserva: id, propertyId, checkIn, checkOut, guests, totalPrice, status, createdAt.
  - Opcional: datos embebidos de la propiedad (título, imagen, ubicación) para no obligar al frontend a hacer una segunda petición. Si no está hoy, se puede añadir un query `?include=property` y devolver `booking` + `property`.
- Asegurar que solo el usuario dueño de la reserva pueda ver el detalle (403 si userId !== booking.userId).

**Criterios de aceptación**

- Tras crear la reserva con `POST /api/bookings`, el frontend puede llamar a `GET /api/bookings/:id` y mostrar resumen completo.
- 403 si el token no corresponde al usuario de la reserva.

---

### 5) Documentación del flujo checkout en API

**Alcance**

- En README o API.md documentar el flujo recomendado para checkout:
  1. `GET /api/properties/:id` (datos de la propiedad).
  2. `GET /api/properties/:id/availability?checkIn=&checkOut=` o `GET /api/properties/:id/booking-preview?checkIn=&checkOut=&guests=` (disponibilidad y precio).
  3. Usuario rellena datos y confirma → `POST /api/bookings` con propertyId, checkIn, checkOut, guests.
  4. Redirección a detalle de reserva → `GET /api/bookings/:id`.
- Incluir ejemplos de request/response y códigos de error (409 NOT_AVAILABLE, 400 GUESTS_EXCEED_MAX, etc.).

**Criterios de aceptación**

- Un desarrollador frontend puede implementar la pantalla de checkout usando solo la documentación de la API.
- No se añaden dependencias nuevas en el backend.

---

## 🧱 Endpoints implicados (resumen)

- `GET /api/properties/:id` — datos de la propiedad.
- `GET /api/properties/:id/availability?checkIn=&checkOut=` — disponibilidad (ya existente).
- `GET /api/properties/:id/booking-preview?checkIn=&checkOut=&guests=` — **nuevo o opcional**: precio y disponibilidad para el resumen de checkout.
- `POST /api/bookings` — crear reserva (body: propertyId, checkIn, checkOut, guests; opcional: guestInfo).
- `GET /api/bookings/:id` — detalle de reserva (para post-checkout).

---

## ✅ Criterios de aceptación globales del Milestone 6

- El frontend puede mostrar resumen de propiedad, desglose de precios y confirmar la reserva usando solo la API.
- Disponibilidad y totalPrice son coherentes entre preview (si existe) y creación.
- Capacidad (maxGuests) y fechas validadas; errores claros para UX.
- Flujo documentado para integración frontend.
