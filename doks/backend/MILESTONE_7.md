# 🎯 Milestone 7 (Backend): Preparación para producción y datos de desarrollo

## 📋 Fuente de verdad

- Reglas: `.cursor/rules/No-dependencias.mdc` (dependencias mínimas; sin MongoDB real en este milestone)
- Backend actual: Milestones 1–6 ya implementados (auth, properties, bookings, users, reviews, favorites, notifications, host, search)

## 🎯 Objetivo

Preparar el backend para uso en desarrollo y futura extensibilidad **sin añadir dependencias**:

- Seed de datos de ejemplo para probar el frontend con datos coherentes.
- Información de la API (versión, modo memoria) para integración y despliegue.
- Documentación de variables de entorno y de contratos de stores para quien implemente persistencia real más adelante.

## ✅ Principios / restricciones

- **No** agregar dependencias NPM nuevas.
- Persistencia sigue siendo **in-memory**; los stores se pueden resetear solo en modo desarrollo para el seed.
- Rutas de desarrollo (p. ej. `/api/dev/seed`) **solo** disponibles cuando `USE_MEMORY_ONLY=true` o `NODE_ENV=development`.

---

## 🧩 Milestone 7 — Tareas (máximo 5)

### 1) Seed de datos de desarrollo

**Alcance**

- Endpoint `POST /api/dev/seed` que:
  - Solo está registrado si `USE_MEMORY_ONLY=true` o `NODE_ENV=development`.
  - Resetea los stores in-memory y crea datos de ejemplo: usuarios (hosts + huésped), propiedades, reservas (y opcionalmente favoritos/reviews).
- Añadir en cada store in-memory una función `memoryResetForDev()` que vacíe los datos (solo para uso interno del seed).

**Criterios de aceptación**

- En producción (sin modo memoria) la ruta `/api/dev/*` no existe (404).
- Tras `POST /api/dev/seed` se pueden listar propiedades, hacer login con los usuarios de ejemplo y ver reservas coherentes.

---

### 2) Endpoint de información de la API

**Alcance**

- `GET /api/info` (público) que responda con:
  - `version`: versión de la API (p. ej. desde `package.json` o constante).
  - `memoryOnly`: boolean indicando si se está usando solo memoria.
  - `env`: `"development"` o `"production"` según `NODE_ENV`.

**Criterios de aceptación**

- El frontend u orquestadores pueden detectar el modo de la API sin leer código.

---

### 3) Documentación de variables de entorno

**Alcance**

- Actualizar `.env.example` con todas las variables usadas y una línea de comentario por variable.
- En `README.md` (o sección dedicada) describir brevemente cada variable: propósito y valores típicos.

**Criterios de aceptación**

- Cualquier desarrollador puede configurar el backend solo con `.env.example` y README.

---

### 4) Documentación de contratos de stores

**Alcance**

- Crear `doks/backend/STORES.md` que liste cada store in-memory y sus métodos públicos (firmas o descripción), para que en el futuro se pueda implementar un adaptador (p. ej. MongoDB) sin cambiar la lógica de los servicios.

**Criterios de aceptación**

- No se cambia la implementación de los servicios; solo se documenta el contrato actual de los stores.

---

### 5) Registro condicional de rutas de desarrollo

**Alcance**

- Montar las rutas bajo `/api/dev` solo cuando `env.USE_MEMORY_ONLY === true` o `process.env.NODE_ENV === 'development'`.
- En cualquier otro caso no registrar el router de dev (evitar exponer seed en producción).

**Criterios de aceptación**

- `POST /api/dev/seed` responde 404 en producción cuando no se usa modo memoria.

---

## 🧱 Estructura sugerida

- `src/routes/dev.routes.ts` — rutas de desarrollo (seed, etc.).
- `src/dev/seed.ts` — lógica de reseteo y creación de datos de ejemplo (usa stores y auth.service para usuarios).
- `src/app.ts` — registrar `/api/info` y condicionalmente `/api/dev`.
- `doks/backend/STORES.md` — contratos de stores.

---

## 📦 Dependencias

No se añaden. Se reutiliza bcrypt (ya presente) para hashear contraseñas de usuarios de seed si se crean vía auth.service.

---

## 🔌 Endpoints añadidos (resumen)

| Método | Ruta            | Auth | Descripción |
|--------|-----------------|------|-------------|
| GET    | /api/info       | No   | `{ version, memoryOnly, env }`. |
| POST   | /api/dev/seed   | No   | Solo en dev/memoria. Resetea y crea datos de ejemplo. 200: `{ ok: true, ... }`. |
