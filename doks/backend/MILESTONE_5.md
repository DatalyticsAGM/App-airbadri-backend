# 🎯 Milestone 5 (Backend): Soporte para Búsqueda Avanzada (Search)

## 📋 Fuente de verdad

- Frontend: `doks/frontend/MILESTONE_5.md` (Módulo de búsqueda avanzada: autocompletado, historial, filtros)
- Reglas: `.cursor/rules/No-dependencias.mdc`

---

## 🎯 Objetivo

Asegurar que la API REST soporte todos los casos de uso del módulo de búsqueda avanzada del frontend:

- Búsqueda por texto, ubicación, precio, amenities, rating y fechas.
- Respuesta paginada y estable para que el frontend implemente ordenamiento y filtros rápidos.
- Endpoints opcionales de sugerencias (ubicaciones o términos) sin añadir dependencias pesadas.

---

## ✅ Principios / restricciones

- **No** agregar nuevas dependencias NPM (usar datos in-memory y estructuras ya existentes).
- Reutilizar `GET /api/properties` con query params ya definidos; extender solo si hace falta.
- Respuestas de error consistentes: `{"error": {"code": "SOME_CODE", "message": "..."}}`.

---

## 🧩 Milestone 5 — Tareas (máximo 5)

### 1) Documentar y estabilizar query params de `GET /api/properties`

**Alcance**

- Asegurar que `GET /api/properties` acepte y documente:
  - `q` (texto libre en título, descripción, ubicación)
  - `location` (substring en ubicación)
  - `minPrice`, `maxPrice`
  - `amenities` (lista o CSV: p. ej. `wifi,kitchen`)
  - `minRating` (filtrar por rating promedio de reviews)
  - `checkIn`, `checkOut` (filtrar propiedades con disponibilidad en ese rango)
  - `page`, `limit`
  - Opcionales: `propertyType`, `minBedrooms`, `minBathrooms`, `minGuests` si el modelo lo soporta.
- Respuesta estable: `{ items, page, limit, total }` con items de tipo Property (id, title, location, pricePerNight, images, amenities, hostId, etc.).

**Criterios de aceptación**

- Todos los filtros documentados en README o API.md.
- Filtros combinados funcionan correctamente (p. ej. location + minPrice + checkIn/checkOut).
- Paginación consistente (total correcto, sin saltos de página).

---

### 2) Ordenamiento de resultados de búsqueda

**Alcance**

- Añadir query param opcional `sort` (y si aplica `order`) a `GET /api/properties`:
  - Valores sugeridos: `price_asc`, `price_desc`, `rating_desc`, `newest` (por createdAt), `relevance` (por defecto o por coincidencia de texto).
- Implementación in-memory: ordenar el array filtrado según el valor de `sort` antes de aplicar paginación.

**Criterios de aceptación**

- Al menos dos criterios de ordenamiento funcionan (p. ej. precio y rating).
- Valores inválidos de `sort` no rompen la API (ignorar o usar default).

---

### 3) Endpoint de sugerencias de ubicaciones (opcional, MOCK)

**Alcance**

- Nuevo endpoint `GET /api/search/suggestions` (o `GET /api/properties/suggestions`):
  - Query: `q` (texto parcial).
  - Respuesta: lista de sugerencias de “ubicaciones” extraídas de las propiedades existentes en memoria (p. ej. valores únicos de `property.location` que contengan `q`), limitada a 10–15 resultados.
- No requiere base de datos externa; se deriva del store `memoryProperties`.

**Criterios de aceptación**

- Si no hay `q` o está vacío, devolver array vacío o lista de ubicaciones populares (p. ej. las más repetidas).
- Respuesta rápida y en formato array de strings o `{ "suggestions": ["..."] }`.

---

### 4) Historial de búsquedas (opcional, MOCK)

**Alcance**

- Si el frontend envía historial de búsquedas del usuario, el backend no tiene por qué persistirlo; el frontend puede usar localStorage.
- Alternativa backend: store in-memory por `userId` con últimas N búsquedas (query params o body guardados) y endpoints:
  - `GET /api/search/history` (Bearer) → últimas búsquedas del usuario.
  - `POST /api/search/history` (Bearer) → guardar una búsqueda (body con query o filtros).
  - `DELETE /api/search/history` (Bearer) → vaciar historial.
- Implementación mínima: array en memoria por usuario, sin nueva dependencia.

**Criterios de aceptación**

- Si se implementa, solo el usuario autenticado accede a su propio historial.
- No obligatorio para cerrar M5 si el frontend usa solo localStorage.

---

### 5) Coherencia con frontend: filtros rápidos y precios

**Alcance**

- Asegurar que “Precio bajo”, “Mejor valorado”, “Nuevo” del frontend se puedan implementar con:
  - `sort=price_asc` / `sort=price_desc`
  - `sort=rating_desc`
  - `sort=newest`
- Verificar que `minPrice`/`maxPrice` y `minRating` respondan con datos coherentes (propiedades con precios y ratings calculados desde reviews).

**Criterios de aceptación**

- Documentar en API.md la relación entre filtros del frontend y query params del backend.
- Al menos un flujo E2E manual: búsqueda con filtros + ordenamiento y comprobar que los resultados son correctos.

---

## 🧱 Endpoints implicados (resumen)

- `GET /api/properties` — búsqueda principal (filtros + sort + paginación).
- `GET /api/properties/:id/availability?checkIn=&checkOut=` — ya existente; usado por búsqueda por fechas.
- `GET /api/search/suggestions?q=` — opcional.
- `GET /api/search/history`, `POST /api/search/history`, `DELETE /api/search/history` — opcionales.

---

## ✅ Criterios de aceptación globales del Milestone 5

- La búsqueda avanzada del frontend puede apoyarse 100% en la API actual (o con las extensiones mínimas anteriores).
- No se añaden dependencias nuevas.
- Parámetros de búsqueda y ordenamiento están documentados y estables.
