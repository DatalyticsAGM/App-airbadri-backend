## Checklist QA – Airbnb Backend API (Postman collection)

Fecha: 2026-02-05  
Colección: `doks/backend/postman/Airbnb-Backend-API.postman_collection.json`  
Base URL (colección): `http://localhost:3333`

### Paso 0 – Finalizar ejecuciones en el puerto e iniciar `npm run dev`

- [x] **Puerto detectado**: `3333` (variable `baseUrl` en la colección).
- [x] **Proceso en puerto 3333 finalizado**: listener eliminado (PID: `23168`).
- [x] **Servidor iniciado**: `npm run dev`.
- [x] **Servidor “ready”**: logs muestran `API lista en http://localhost:3333` y `Persistencia: MongoDB`.

### Paso 1 – Primera carpeta de la colección (Postman)

- [x] **Primera carpeta**: `Health & Info`
- [x] **Requests dentro**:
  - `GET /`
  - `GET /health`
  - `GET /ready`
  - `GET /api/info`

### Paso 2 – Peticiones realizadas correctamente (usando credenciales admin)

> Nota: `Health & Info` no requiere auth. Para cumplir el uso de admin y poder validar persistencia (Paso 4), se probó también el flujo mínimo de `Auth` + `Users`.

- [x] **Health & Info**
  - [x] `GET /` → 200
  - [x] `GET /health` → 200
  - [x] `GET /ready` → 200 (incluye `mongo:"connected"`)
  - [x] `GET /api/info` → 200
- [x] **Dev**
  - [x] `POST /api/dev/seed` → 404 (en esta ejecución no está montada la ruta dev; la colección permite 200 o 404)
- [x] **Auth (admin)**
  - [x] `POST /api/auth/login` con `administrador@example.com` / `123456` → 200 y devuelve `accessToken`
- [x] **Users (admin)**
  - [x] `PATCH /api/users/me` (Bearer token) → 200; actualiza `fullName` y `avatarUrl`

### Paso 3 – Encabezados de respuesta (headers) verificados

- [x] **CORS**
  - `Access-Control-Allow-Origin: http://localhost:3000`
  - `Access-Control-Allow-Credentials: true`
  - `Vary: Origin`
- [x] **Content-Type**
  - Respuestas JSON con `Content-Type: application/json; charset=utf-8`
- [x] **Evidencia (archivos HTTP)**
  - `qa-health-info.http`
  - `qa-dev-seed.http`
  - `qa-auth-login.http` *(contiene token; tratar como sensible)*
  - `qa-users-me-patch.http`

### Paso 4 – Script JS para verificar persistencia real en MongoDB

- [x] **Cambio verificado**: actualización del usuario admin en la colección `users`
  - email: `administrador@example.com`
  - fullName esperado: `Admin Sistema QA`
  - avatarUrl esperado: `https://example.com/qa-admin.jpg`
- [x] **Script**: `qa-verify-db.js`
  - Ejecutado:
    - `node qa-verify-db.js administrador@example.com "Admin Sistema QA" "https://example.com/qa-admin.jpg"`
  - Resultado: `ok: true` (coinciden `fullName` y `avatarUrl`)

### Artefactos generados (para trazabilidad)

- [x] `qa-health-info.http` (headers + body de Health & Info)
- [x] `qa-dev-seed.http` (404 esperado)
- [x] `qa-auth-login.http` (**incluye `accessToken`**)
- [x] `qa-login.json` (**incluye `accessToken`**, usado para extraer token en scripts)
- [x] `qa-users-me-patch.http` (headers + body)
- [x] `qa-users-me-patch.json` (body)
- [x] `qa-verify-db.js` (verificación en MongoDB)

### Observaciones rápidas

- La ruta `POST /api/dev/seed` devuelve 404 en este entorno porque las rutas `dev` solo se montan si `NODE_ENV === "development"` o `USE_MEMORY_ONLY=true`. Esto **no bloqueó** la prueba porque el usuario admin ya existía y se pudo hacer login.

